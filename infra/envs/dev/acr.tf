resource "azurerm_container_registry" "main" {
  name                = "DigiBaton"
  location            = azurerm_resource_group.digi_baton.location
  resource_group_name = azurerm_resource_group.digi_baton.name
  sku                 = "Basic"
  admin_enabled       = true
}
