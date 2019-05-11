function (doc) {
  emit([doc.lga_code, doc.user.id], {"polarity":doc.polarity, "geo_coordinates":doc.geo_coordinates, "suburb":doc.suburb, "text":doc.text});
}
