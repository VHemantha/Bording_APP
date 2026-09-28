from rest_framework.throttling import AnonRateThrottle


class AIRateThrottle(AnonRateThrottle):
    """Per-client rate limit for the public AI endpoints (each call spends API credits).

    Rate comes from REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']['ai'] (env AI_THROTTLE_RATE).
    Counters live in Django's default local-memory cache, so they are per gunicorn worker.
    """

    scope = 'ai'

    def get_ident(self, request):
        # Behind a load balancer REMOTE_ADDR is the proxy, so every visitor would share
        # one bucket. The proxy (AWS ALB / Azure App Service) appends the real client to
        # X-Forwarded-For, so take the LAST entry (earlier ones are client-supplied and
        # spoofable) and drop the ":port" App Service adds to IPv4 addresses (the ALB
        # sends a bare IP). Adding a CDN such as CloudFront in front would put the CDN's
        # address last, so revisit this if you do.
        forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if forwarded:
            ip = forwarded.split(',')[-1].strip()
            if ip.count(':') == 1:
                ip = ip.rsplit(':', 1)[0]
            return ip
        return super().get_ident(request)
