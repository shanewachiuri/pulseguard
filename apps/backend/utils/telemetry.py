import os
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor

def setup_telemetry(app):
    # 1. Define service identity for compliance reporting
    resource = Resource.create({
        "service.name": "pulseguard-backend",
        "service.version": "1.0.0",
        "deployment.environment": os.getenv("ENVIRONMENT", "local")
    })

    # 2. Configure Tracer to export to Sentry/OpenObserve via OTLP
    provider = TracerProvider(resource=resource)
    # In production, this would be your Sentry/Grafana OTLP endpoint
    otlp_exporter = OTLPSpanExporter(endpoint="http://localhost:4318/v1/traces")
    provider.add_span_processor(BatchSpanProcessor(otlp_exporter))

    trace.set_tracer_provider(provider)

    # 3. Auto-instrument FastAPI and outbound HTTP calls (M-Pesa/Polygon RPC)
    FastAPIInstrumentor.instrument_app(app)
    HTTPXClientInstrumentor().instrument()

tracer = trace.get_tracer(__name__)