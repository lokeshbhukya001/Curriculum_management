from django.apps import AppConfig


class AuditLogsConfig(AppConfig):
    name = 'apps.audit_logs'

    def ready(self):
        import apps.audit_logs.signals
