function (doc) {
  emit([doc.properties.lga_code16, doc.properties.lga_name16],Number(doc.properties.admis_mental_hlth_rltd_cond_p_all_hosps_2016_17_num));
}
