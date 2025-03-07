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

  sku_name = "B_Standard_B2s"
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_all_ips" {
  name             = "allow-all"
  start_ip_address = "0.0.0.0"
  end_ip_address   = "255.255.255.255"
  server_id        = azurerm_postgresql_flexible_server.main.id
}

resource "azurerm_postgresql_flexible_server_database" "crypto" {
  name      = "crypto-dev"
  collation = "ja_JP.utf8"
  charset   = "UTF8"
  server_id = azurerm_postgresql_flexible_server.main.id
}

resource "azurerm_postgresql_flexible_server_database" "backend" {
  name      = "backend-dev"
  collation = "ja_JP.utf8"
  charset   = "UTF8"
  server_id = azurerm_postgresql_flexible_server.main.id
}
