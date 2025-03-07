resource "azurerm_key_vault" "main" {
  location            = azurerm_resource_group.digi_baton.location
  resource_group_name = azurerm_resource_group.digi_baton.name
  name                = "digi-baton-dev"
  sku_name            = "standard"
  tenant_id           = data.azurerm_client_config.current.tenant_id
}

resource "azurerm_key_vault_access_policy" "main" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id

  object_id = data.azurerm_user_assigned_identity.main.principal_id

  secret_permissions = [
    "Get",
    "List",
    "Set",
    "Delete",
  ]
}

data "azurerm_key_vault_secret" "pg_password" {
  name         = "pg-password"
  key_vault_id = azurerm_key_vault.main.id
}

data "azurerm_key_vault_secret" "clerk_secret_key" {
  name         = "clerk-secret-key"
  key_vault_id = azurerm_key_vault.main.id
}

data "azurerm_key_vault_secret" "clerk_pub_key" {
  name         = "clerk-pub-key"
  key_vault_id = azurerm_key_vault.main.id
}
