resource "kubernetes_storage_class" "ebs_gp3" {
  metadata {
    name = "ebs-gp3"
  }

  storage_provisioner    = "ebs.csi.eks.amazonaws.com"
  reclaim_policy          = "Delete"
  volume_binding_mode     = "WaitForFirstConsumer"
  allow_volume_expansion  = true

  parameters = {
    type = "gp3"
  }
}