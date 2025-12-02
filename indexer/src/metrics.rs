use iota_metrics::RegistryService;
use prometheus::Registry;

pub(crate) struct PrometheusServer {
    registry_service: RegistryService,
}

impl PrometheusServer {
    pub(crate) fn new() -> Self {
        Self {
            registry_service: RegistryService::new(Registry::new()),
        }
    }

    // pub(crate) async fn start(&self, token: CancellationToken) -> anyhow::Result<()> {
    //     let addr = SocketAddr::new(IpAddr::V4(Ipv4Addr::new(0, 0, 0, 0)), 9189);
    //     info!("Starting prometheus metrics at {addr}");

    //     let app = Router::new()
    //         .route(METRICS_ROUTE, get(iota_metrics::metrics))
    //         .layer(Extension(self.registry_service.clone()));

    //     let listener = tokio::net::TcpListener::bind(&addr).await?;
    //     async fn shutdown_signal(token: CancellationToken) {
    //         token.cancelled().await;
    //     }
    //     axum::serve(listener, app.into_make_service())
    //         .with_graceful_shutdown(shutdown_signal(token))
    //         .await?;

    //     Ok(())
    // }

    pub(crate) fn registry(&self) -> Registry {
        self.registry_service.default_registry()
    }
}
