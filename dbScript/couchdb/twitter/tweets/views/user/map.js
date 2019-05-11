function (doc) {
  emit([doc.user.id, doc.lga_code], {"polarity":doc.polarity, "geo_coordinates":doc.geo_coordinates, "suburb":doc.suburb, "text":doc.text});
}
