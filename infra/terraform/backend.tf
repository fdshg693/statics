terraform {
  backend "azurerm" {
    resource_group_name  = "rg-statics-tfstate"
    storage_account_name = "ststaticstfstate"
    container_name       = "tfstate"
    key                  = "aks.tfstate"
  }
}
