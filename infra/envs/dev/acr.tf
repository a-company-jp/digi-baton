resource "azurerm_container_registry" "backend" {
  name                = "DigiBatonBackendDev"
  location            = azurerm_resource_group.digi_baton.location
  resource_group_name = azurerm_resource_group.digi_baton.name
  sku                 = "Basic"
  admin_enabled       = false
}

resource "azurerm_container_registry" "frontend" {
  name                = "DigiBatonFrontendDev"
  location            = azurerm_resource_group.digi_baton.location
  resource_group_name = azurerm_resource_group.digi_baton.name
  sku                 = "Basic"
  admin_enabled       = false
}

resource "azurerm_container_registry" "crypto" {
  name                = "DigiBatonCryptoDev"
  location            = azurerm_resource_group.digi_baton.location
  resource_group_name = azurerm_resource_group.digi_baton.name
  sku                 = "Basic"
  admin_enabled       = false
}

resource "azurerm_container_registry" "external" {
  name                = "DigiBatonExternalDev"
  location            = azurerm_resource_group.digi_baton.location
  resource_group_name = azurerm_resource_group.digi_baton.name
  sku                 = "Basic"
  admin_enabled       = false
}

