---
name: add-node-api-resource
description: Add a merchant API resource to the MainMoney Node.js SDK from OpenAPI
---

# Add a Node API resource

1. Read the pinned contract `contrib/contract/openapi/merchants.openapi.yaml`
   (and `contrib/contract/resources.md`). Cross-check live
   `/api/v1/schema/merchants/` if the pin may be behind. Do not invent endpoints.
2. Add a typed client method and Vitest coverage.
3. Document the call in README for installers only.
