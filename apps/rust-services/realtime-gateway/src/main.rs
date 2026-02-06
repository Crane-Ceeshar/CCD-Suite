use actix_web::{web, App, HttpResponse, HttpServer};
use serde::Serialize;

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    service: String,
    timestamp: String,
}

async fn health() -> HttpResponse {
    HttpResponse::Ok().json(HealthResponse {
        status: "ok".to_string(),
        service: "realtime-gateway".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    })
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
        )
        .init();

    let port = std::env::var("PORT")
        .or_else(|_| std::env::var("RUST_REALTIME_PORT"))
        .unwrap_or_else(|_| "5003".to_string())
        .parse::<u16>()
        .expect("Invalid port");

    tracing::info!("Realtime gateway starting on port {}", port);

    HttpServer::new(|| App::new().route("/health", web::get().to(health)))
        .bind(("0.0.0.0", port))?
        .run()
        .await
}
