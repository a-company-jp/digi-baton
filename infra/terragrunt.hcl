remote_state {
  backend = "azurerm"
  generate = {
    path      = "_backend.tf"
    if_exists = "overwrite"
  }
  config = {
    subscription_id      = get_env("AZURE_SUBSCRIPTION_ID")
    resource_group_name  = "digi-baton"
    storage_account_name = "tfstate16878"
    container_name       = "tfstate"
    key                  = "${path_relative_to_include()}/terraform.tfstate"
  }
}
