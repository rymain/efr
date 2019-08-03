import App from '/efr/js/components/app.js';

Vue.filter('toCurrency', function (value) {
    if (typeof value !== "number") {
      return value;
    }
    var formatter = new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0
    });
    return formatter.format(value);
});
  
Vue.filter('toPercentage', function (value, decimals = 2) {
  if (!value) value = 0
  if (!decimals) decimals = 0

  value = value * 100
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals) + '%'
});

Vue.use(Vuetify);

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.5.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.5.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.5.1/images/marker-shadow.png'
});

new Vue({
    vuetify: new Vuetify(),
    render: h => h(App),
}).$mount(`#app`);