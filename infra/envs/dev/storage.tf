resource "azurerm_storage_account" "main" {
  name                     = "digibatonmainstorageacct"
  resource_group_name      = azurerm_resource_group.digi_baton.name
  location                 = azurerm_resource_group.digi_baton.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_storage_container" "public_container" {
  name                  = "digibatonpublic"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "blob"
}
