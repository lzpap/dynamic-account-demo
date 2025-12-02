mod config;

use anyhow::Result;
use clap::Parser;
use tracing::{error, info, warn};
use tracing_subscriber::{
    EnvFilter, fmt::format::FmtSpan, layer::SubscriberExt, util::SubscriberInitExt,
};

// Define the `GIT_REVISION` and `VERSION` consts
bin_version::bin_version!();

#[derive(Parser)]
#[command(
    name = env!("CARGO_BIN_NAME"),
    about = env!("CARGO_PKG_DESCRIPTION"),
    author,
    version = VERSION,
    propagate_version = true,
)]
enum Command {
    Start {
        /// The URL of an IOTA node with JSON API.
        #[arg(long, default_value = "http://localhost:9000")]
        node_url: String,
        /// The URL of an IOTA node with REST API enabled or a historical store.
        #[arg(long, default_value = "http://localhost:9000")]
        checkpoint_url: String,
        /// The number of workers to spawn in parallel.
        #[arg(long, default_value_t = 1)]
        num_workers: usize,
        /// The port to run the API server on.
        #[arg(long, default_value_t = 3030)]
        api_port: u16,
    }
}

impl Command {
    async fn execute(&self) -> Result<()> {
        match self {
            Command::Start {
                node_url,
                checkpoint_url,
                num_workers,
                api_port,
            } => {
                info!("Starting iSafe Indexer");
                Ok(())
            }
        }
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    dotenvy::dotenv().ok();

    set_up_logging()?;

    Command::parse().execute().await?;
    Ok(())
}

fn set_up_logging() -> Result<()> {
    std::panic::set_hook(Box::new(|p| {
        error!("{p}");
    }));

    tracing_subscriber::registry()
        .with(EnvFilter::from_default_env())
        .with(tracing_subscriber::fmt::layer().with_span_events(FmtSpan::CLOSE))
        .init();
    Ok(())
}