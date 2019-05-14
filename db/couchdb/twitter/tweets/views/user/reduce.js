function (keys, values, rereduce) {
  if (rereduce) {
    var total_value = 0, count = 0, min_value = 0, max_value = 0, positive_count = 0, negative_count = 0, max_count = 0,
    positive_sum = 0, negative_sum = 0, negative_text = "", positive_text = "", suburb = "", geo_coordinates =[];
    values.reduce(function(a, b) {
        total_value += b.sum;
        count += b.count;
        positive_count += b.positive_count;
        negative_count += b.negative_count;
        positive_sum += b.positive_sum;
        negative_sum += b.negative_sum;
        if(b.count >= max_count){
          geo_coordinates = b.geo_coordinates;
          suburb = b.suburb;
        }
        if (b.min < min_value){
          min_value = b.min;
          negative_text = b.negative_text;
        }
        if (b.max > max_value){
          max_value = b.max;
          positive_text = b.positive_text;
        }
    }, 0);
    var positive_mean = (positive_count == 0) ? 0:positive_sum/positive_count;
    var negative_mean = (negative_count == 0) ? 0:negative_sum/negative_count;
    return {
      'sum': total_value,
      'count': count,
      'min': min_value,
      'max': max_value,
      'mean': count == 0 ? 0 : total_value/count,
      'positive_sum': positive_sum,
      'negative_sum': negative_sum,
      'positive_count': positive_count,
      'negative_count': negative_count,
      'positive_mean': positive_mean,
      'negative_mean': negative_mean,
      'fluctuation': positive_mean - negative_mean,
      'sentiment': positive_mean + negative_mean,
      'positive_text': positive_text,
      'negative_text': negative_text,
      'geo_coordinates': geo_coordinates,
      'suburb': suburb,
    }
  } else {
    var total_value = 0, min_value = 0, max_value = 0, positive_count = 0, negative_count = 0,
    positive_sum = 0, negative_sum = 0, negative_text ="", positive_text = "";
    values.forEach(function(vObj){
      var value = vObj.polarity;
      total_value += value;
      if (value >= 0 ){
        positive_count ++;
        positive_sum += value;
        if( value > max_value) {
          max_value = value;
          positive_text = vObj.text;
        }
      }
      else {
        negative_count ++;
        negative_sum += value;
        if( value < min_value) {
          min_value = value;
          negative_text = vObj.text;
        }
      }
    });
    var positive_mean = (positive_count == 0)? 0: positive_sum/positive_count;
    var negative_mean = (negative_count == 0)? 0: negative_sum/negative_count;
    return {
      'sum': total_value,
      'count': values.length,
      'min': min_value,
      'max': max_value,
      'mean': (values.length == 0)? 0 : total_value/values.length,
      'positive_sum': positive_sum,
      'negative_sum': negative_sum,
      'positive_count': positive_count,
      'negative_count': negative_count,
      'positive_mean': positive_mean,
      'negative_mean': negative_mean,
      'fluctuation': positive_mean - negative_mean,
      'sentiment': positive_mean + negative_mean,
      'positive_text': positive_text,
      'negative_text': negative_text,
      'geo_coordinates': values[values.length -1].geo_coordinates,
      'suburb': values[values.length -1].suburb,
    }
  }
}
