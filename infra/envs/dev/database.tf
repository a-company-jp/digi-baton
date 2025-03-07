resource "azurerm_postgresql_flexible_server" "main" {
  name                          = "psqlflexibleserver-dev"
  resource_group_name           = azurerm_resource_group.digi_baton.name
  location                      = azurerm_resource_group.digi_baton.location
  version                       = "16"
  public_network_access_enabled = true
  administrator_login           = "system"
  administrator_password        = data.azurerm_key_vault_secret.pg_password.value
  zone                          = "1"

  storage_mb   = 32768
  storage_tier = "P4"

  sku_name   = "B_Standard_B2s"
}