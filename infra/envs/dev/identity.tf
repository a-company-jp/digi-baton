data "azurerm_user_assigned_identity" "main" {
  name                = "digi-baton-main"
  resource_group_name = azurerm_resource_group.digi_baton.name
}
