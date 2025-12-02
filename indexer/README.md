# iSafe Indexer

A crucial part of the iSafe application is the backend indexer that listens to isafe events from the chain and exposes them to the frontend application.

It is implemented using the Custom Indexer framework.

Exposes a REST API with GET methods to return isafe account information, furthermore a POST route to save plain transactions.