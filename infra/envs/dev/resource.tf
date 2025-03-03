resource "azurerm_resource_group" "state-demo-secure" {
  name     = "state-demo"
  location = "eastus"
}

resource "azurerm_resource_group" "digi_baton" {
  name     = "digi-baton"
  location = "japaneast"
}
