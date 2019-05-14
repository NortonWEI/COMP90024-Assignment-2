function (doc) {
  emit([doc.lga_code, doc.lga_name], doc.sickness_allowance);
}
