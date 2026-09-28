#!/usr/bin/env bash
# One-time preparation of a FRESH Ubuntu (22.04/24.04) or Debian (12+) server. Run as root over SSH:
#
#   DEPLOY_SSH_KEY='ssh-ed25519 AAAA... you@pc' bash setup-server.sh
#
# DEPLOY_SSH_KEY is YOUR public key (the one line from your PC's id_ed25519.pub). It becomes the only key
# that can log in. Keys already present in root's authorized_keys are deliberately NOT copied over, because
# providers and base images sometimes pre-install keys you didn't create.
#
# It is safe to run again. It:
#   1. updates the system and turns on automatic security updates
#   2. installs Docker Engine + the compose plugin from Docker's official repository
#   3. adds a 2 GB swap file if there is none (building the image needs the memory)
#   4. creates a non-root "deploy" user (docker group + passwordless sudo) that owns /opt/nestwell,
#      and installs your key for it
#   5. turns on the firewall (SSH, 80, 443 only) and fail2ban (blocks password-guessing bots)
#   6. disables SSH password logins AND root SSH logins - but ONLY once your key is installed for the
#      deploy user and sudo works, so it can never lock you out. (Admin access afterwards: log in as
#      deploy, then `sudo -i`.)
#
# Env overrides: DEPLOY_USER (default deploy), APP_DIR (default /opt/nestwell),
#                COPY_ROOT_KEYS=1 (also copy root's existing authorized_keys - only if you trust every one of them)
set -euo pipefail

[ "$(id -u)" -eq 0 ] || { echo "Run this as root (log in as root, or use sudo)." >&2; exit 1; }

DEPLOY_USER="${DEPLOY_USER:-deploy}"
APP_DIR="${APP_DIR:-/opt/nestwell}"
export DEBIAN_FRONTEND=noninteractive

. /etc/os-release
case "${ID:-}" in
  ubuntu | debian) ;;
  *) echo "Unsupported OS '${ID:-unknown}': this script supports Ubuntu and Debian." >&2; exit 1 ;;
esac

# Validate the key BEFORE changing anything, so a typo can't end in a half-configured server.
if [ -n "${DEPLOY_SSH_KEY:-}" ]; then
  key_tmp=$(mktemp)
  printf '%s\n' "$DEPLOY_SSH_KEY" >"$key_tmp"
  if ! ssh-keygen -l -f "$key_tmp" >/dev/null 2>&1; then
    rm -f "$key_tmp"
    echo "DEPLOY_SSH_KEY is not a valid SSH public key. It must be the single line from id_ed25519.pub" >&2
    echo "(starting with 'ssh-ed25519' or 'ssh-rsa'). Wrap it in single quotes." >&2
    exit 1
  fi
  rm -f "$key_tmp"
elif [ -z "${COPY_ROOT_KEYS:-}" ]; then
  echo "Set DEPLOY_SSH_KEY to your public key, for example:" >&2
  echo "  DEPLOY_SSH_KEY='ssh-ed25519 AAAA... you@pc' bash setup-server.sh" >&2
  echo "(On your PC, in PowerShell:  Get-Content \$env:USERPROFILE\\.ssh\\id_ed25519.pub )" >&2
  exit 1
fi

echo "==> 1/6 Updating the system"
apt-get update -y
apt-get upgrade -y
apt-get install -y ca-certificates curl git gnupg openssl sudo openssh-client ufw fail2ban python3-systemd unattended-upgrades
cat >/etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF

echo "==> 2/6 Installing Docker"
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL "https://download.docker.com/linux/$ID/gpg" -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/$ID ${UBUNTU_CODENAME:-$VERSION_CODENAME} stable" \
    >/etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker
docker --version
docker compose version

echo "==> 3/6 Swap"
if [ -z "$(swapon --show --noheadings)" ]; then
  fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >>/etc/fstab
  echo "created a 2 GB swap file"
else
  echo "swap already present"
fi

echo "==> 4/6 Deploy user, your SSH key, and the app directory"
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi
usermod -aG docker "$DEPLOY_USER"

KEY_FILE="/home/$DEPLOY_USER/.ssh/authorized_keys"
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
# Some servers lock authorized_keys files with the immutable flag (chattr +i), which makes even root's
# touch/chmod fail with "Operation not permitted". Unlock ours before editing; harmless if it isn't locked.
chattr -i "$KEY_FILE" 2>/dev/null || true
[ -e "$KEY_FILE" ] || touch "$KEY_FILE"
add_key() { grep -qxF "$1" "$KEY_FILE" || printf '%s\n' "$1" >>"$KEY_FILE"; }   # idempotent
if [ -n "${DEPLOY_SSH_KEY:-}" ]; then
  add_key "$DEPLOY_SSH_KEY"
fi
if [ -n "${COPY_ROOT_KEYS:-}" ] && [ -s /root/.ssh/authorized_keys ]; then
  while IFS= read -r key; do
    [ -n "$key" ] && add_key "$key"
  done </root/.ssh/authorized_keys
fi
chown "$DEPLOY_USER:$DEPLOY_USER" "$KEY_FILE"
chmod 600 "$KEY_FILE"

mkdir -p "$APP_DIR"
# -R: if you already cloned the repo here as root, git would refuse to work for the deploy user ("dubious ownership")
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"

echo "==> 5/6 Firewall and fail2ban"
SSH_PORT=$(sshd -T 2>/dev/null | awk '$1 == "port" {print $2; exit}')
SSH_PORT="${SSH_PORT:-22}"
ufw default deny incoming
ufw default allow outgoing
ufw limit "${SSH_PORT}/tcp" >/dev/null   # allow SSH but rate-limit repeated connection attempts
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable
# Ubuntu/Debian may not have a classic auth.log, so read SSH failures from the systemd journal.
cat >/etc/fail2ban/jail.d/sshd.local <<EOF
[sshd]
enabled = true
backend = systemd
port = ${SSH_PORT}
EOF
systemctl enable fail2ban >/dev/null 2>&1
systemctl restart fail2ban

echo "==> 6/6 SSH hardening"
if [ -s "$KEY_FILE" ]; then
  # Passwordless sudo for the deploy user (it has no password; the SSH key is its credential). It is in the
  # docker group, which is already root-equivalent, so this adds no real privilege.
  SUDO_OK=""
  echo "$DEPLOY_USER ALL=(ALL) NOPASSWD:ALL" >/etc/sudoers.d/90-nestwell-deploy
  chmod 440 /etc/sudoers.d/90-nestwell-deploy
  if visudo -cf /etc/sudoers.d/90-nestwell-deploy >/dev/null; then
    SUDO_OK=1
  else
    rm -f /etc/sudoers.d/90-nestwell-deploy
  fi
  # Root SSH login is turned off entirely only when sudo works, so an admin path always exists.
  if [ -n "$SUDO_OK" ]; then ROOT_LOGIN=no; else ROOT_LOGIN=prohibit-password; fi
  # sshd uses the FIRST value it sees, so this file must sort before cloud-init's 50-*.conf
  cat >/etc/ssh/sshd_config.d/00-nestwell.conf <<EOF
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin ${ROOT_LOGIN}
EOF
  if sshd -t; then
    systemctl reload ssh 2>/dev/null || systemctl reload sshd
    echo "SSH: password logins are off and root login is '${ROOT_LOGIN}'. Only your SSH key works, as user $DEPLOY_USER."
  else
    rm -f /etc/ssh/sshd_config.d/00-nestwell.conf
    echo "WARNING: sshd rejected the hardening config; it was removed. SSH is unchanged." >&2
  fi
else
  echo "SKIPPED: no SSH key is installed for $DEPLOY_USER, so SSH stays as it was (turning passwords off would lock you out)."
fi

echo
echo "Server is ready."
echo "Next: open a NEW terminal on your PC and check that you can log in with:  ssh $DEPLOY_USER@<this server's IP>"
echo "Keep THIS session open until that works."
