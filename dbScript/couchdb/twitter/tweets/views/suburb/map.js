function (doc) {
  emit([doc.lga_code, doc.suburb], doc.polarity);
}
