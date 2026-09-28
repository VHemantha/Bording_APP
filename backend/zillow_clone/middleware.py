from django.http import HttpResponse


class HealthCheckMiddleware:
    """Answer load-balancer health probes at /healthz.

    Must be the first middleware. An AWS ALB probes each task by its private IP
    (Host: 10.0.x.x:8000), which ALLOWED_HOSTS would reject with a 400, so this replies
    before Django ever validates the Host header. It is a liveness check only: it does
    not touch the database, so a brief RDS hiccup can't make the ALB kill healthy tasks.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path == '/healthz':
            return HttpResponse('ok', content_type='text/plain')
        return self.get_response(request)
