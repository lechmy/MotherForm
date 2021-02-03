// Example
new AjaxForm({
  form: '.mf-init',
  container: '.mf-response-container',
  // additionalData: {
  //  lng: document.getElementById('language').value;
  // },
  queryParams: true,
  pagination: {
    type: 'pagination',
    pattern: '<< < ... [5] ... > >>',
    container: '.mf-pagination',
    pageSize: 10,
    totalCount: 88,
  },
  paginationModel: {
    response: 'data',
    totalCount: 'totalCount',
    pageSize: 'pagesize',
    pageNumber: 'pagenumber',
  },
  beforesend: () => {
    // Add code
  },
  response: function (res) {
    this.container.innerHTML = res;
  }
});