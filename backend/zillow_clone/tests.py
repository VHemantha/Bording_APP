from django.test import SimpleTestCase, TestCase


class HealthCheckTests(SimpleTestCase):
    def test_healthz_ok(self):
        response = self.client.get('/healthz')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, b'ok')

    def test_healthz_ignores_host_header(self):
        # An ALB probes each task by private IP, which is never in ALLOWED_HOSTS.
        response = self.client.get('/healthz', HTTP_HOST='10.0.3.7:8000')
        self.assertEqual(response.status_code, 200)

    def test_other_paths_still_validate_host(self):
        # Guards the test above: proves the bypass is specific to /healthz.
        response = self.client.get('/api/properties/', HTTP_HOST='10.0.3.7:8000')
        self.assertEqual(response.status_code, 400)


class RoutingTests(TestCase):
    def test_api_list_is_public(self):
        response = self.client.get('/api/properties/')
        self.assertEqual(response.status_code, 200)

    def test_unknown_api_path_is_a_real_404(self):
        # The SPA catch-all must not swallow API typos and answer 200 with index.html.
        response = self.client.get('/api/does-not-exist/')
        self.assertEqual(response.status_code, 404)

    def test_client_side_route_falls_back_to_spa(self):
        # Without a built frontend the fallback view says so (404) instead of erroring.
        response = self.client.get('/search')
        self.assertIn(response.status_code, (200, 404))
        self.assertNotEqual(response.status_code, 500)
