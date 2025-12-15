export async function uploadTx(txBytes: string, description: string): Promise<any> {
    const response = await fetch("http://127.0.0.1:3031/add_transaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_bytes: txBytes,
        description: description,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to upload transaction: ${response}`);
    }

    return response.json();
}