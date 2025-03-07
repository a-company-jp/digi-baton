resource "azurerm_virtual_network" "main" {
  name                = "vn-dev"
  location            = azurerm_resource_group.digi_baton.location
  resource_group_name = azurerm_resource_group.digi_baton.name
  address_space       = ["10.0.0.0/16"]
}

resource "azurerm_subnet" "main" {
  name                 = "sn-dev-main"
  resource_group_name  = azurerm_resource_group.digi_baton.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.2.0/24"]
  service_endpoints    = ["Microsoft.Storage"]
  delegation {
    name = "fs"
    service_delegation {
      name = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/join/action",
      ]
    }
  }
}