---
title: Uploading Your First Object CLI
slug: getting-started/quickstart-uplink-cli/uploading-your-first-object
createdAt: 2022-08-02T16:14:49.000Z
updatedAt: 2023-03-03T08:36:11.000Z
docId: R8xZNlt1dr3nZzo-_ZQLx
---

Install and configure the CLI and follow the steps below to upload your first object to Storj DCS.

:::hint{type="success"}
Every time you upload a file, the Storj DCS CLI will do all the heavy lifting - encrypt the data using [](docId\:Pksf8d0TCLY2tBgXeT18d) (including path and metadata), break large files into 64MB Segments (or for smaller files into a single segment), then erasure code the segments, breaking each segment into 80 pieces, then distributing those pieces over our network of thousands of independently operated storage nodes. All of that happens in the background with a simple `cp` command.
:::

*   [ ] [](docId\:b4-QgUOxVHDHSIWpAf3hG)&#x20;
*   [ ] ****[](docId\:h3RyJymEIi4gf2S9wVJg8)&#x20;
*   [ ] ****[](docId\:OJPnxiexQIXHmzGBkvzHc)&#x20;
*   [ ] ****[](docId\:gh5RtIDbMkAoomljO7f8d)&#x20;
*   [ ] ****[](docId:-v_wZieO-SN4FiEn3mmFU)
