function AjaxForm(config) {
  const messagePrefix = '[MotherForm] | Error:';

  const FormTypes = {
    BUTTON: 'button',
    SUBMIT: 'submit',
    SELECT: 'select-one',
    CHECKBOX: 'checkbox',
    RADIO: 'radio',
  };

  const paginationTypes = {
    NONE: 'none',
    PAGE: 'pagination',
    SCROLL: 'infinite-scroll',
    LOAD: 'load-more'
  }

  const paginationPatterns = {
    MINIMAL: '< (x/y) >',
    BASIC: '< [5] >',
    STANDARD: '<< < [5] > >>',
    EXTENDED: '<< < ~ >... [5] ...< ~ > >>',
    // TEXTUAL: '<TEXT [5] TEXT>'
  }

  const paginationPatternsRegEx = /(<{1,2})|(>{1,2})|(\.{3})|(\[[0-9]{1,2}\])/g;

  const baseConfig = {
    form: '',
    container: '',
    additionalData: {},
    queryParams: false,
    pagination: {
      type: paginationTypes.NONE,
      pattern: paginationPatterns.BASIC,
      container: '',
      pageSize: 0,
      pageCount: 0,
      totalCount: 0
    },
    paginationModel: {
      response: 'data',
      pageSize: 'pagesize',
      pageNumber: 'pagenumber',
      pageCount: 'pageCount',
      totalCount: 'totalCount'
    },
    beforesend: () => { },
    response: (res) => {
      if(this.conf.pagination.type == paginationTypes.LOAD || this.conf.pagination.type == paginationTypes.SCROLL) {
        this.conf.container.insertAdjacentHTML('beforeend', res);
      } else {
        this.conf.container.innerHTML = res;
      }
    }
  }

  // VARIABLES
  // --------------------------------------------------
  this.conf = {};
  this.events = ['change', 'submit'];
  this.xhttp = new XMLHttpRequest();
  this.paginationPattern = paginationPatterns;
  this.activePage = 1;
  this.paginationEnabled = false;
  this.pageCount = 1;
  this.IsBusy = false;

  this.parseDataAtt = attr => {
    let data = this.conf.form.getAttribute(attr);
    return data != null ? JSON.parse(data.replaceAll('\'', '\"')) : null;
  }

  this.toBool = value => {
    return value == null ? null : val.toLowerCase() == 'true' ? true : false;
  }

  // GETTERS
  // --------------------------------------------------

  // SETTERS
  // --------------------------------------------------

  this.setForm = form => {
    try {
      this.conf.form = typeof form === 'string' ? document.querySelector(form) : form;
      if(this.conf.form == null) {
        throw new Error();
      }
    } catch (e) {
      throw new SyntaxError(`${messagePrefix} Form not found`);
    }
  }

  this.setContainer = () => {
    try {
      let container = this.conf.form.getAttribute('data-mf-container');
      container = container != null ? container : this.conf.container;
      this.conf.container = document.querySelector(container);
      if(this.conf.container == null) {
        throw new Error();
      }
    } catch (e) {
      throw new SyntaxError(`${messagePrefix} Container not found`);
    }
  }

  this.setQueryParamsSettings = () => {
    let params = this.conf.form.getAttribute('data-mf-query-params');
    params = this.toBool(params);
    this.conf.queryParams = params != null ? params : this.conf.queryParams;
  }

  this.setAdditionalData = data => {
    let dataAdditional = this.parseDataAtt('data-mf-pgn');
    dataAdditional = dataAdditional != null ? dataAdditional : null;
    this.conf.additionalData = data || dataAdditional || this.conf.additionalData;
  }

  this.setPaginationContainer = () => {
    try {
      let container = document.querySelector(this.conf.pagination.container);
      if(container == null) {
        throw new Error()
      }
      this.conf.pagination.container = container
    } catch (e) {
      throw new Error(`${messagePrefix} Pagination container not found`);
    }
    this.conf.pagination.container.classList.add('mf-pagination-container');
  }

  this.setTotalCount = count => {
    let dataTotalCount = this.parseDataAtt('data-mf-pgn');
    dataTotalCount = dataTotalCount != null ? parseInt(dataTotalCount['totalCount']) : {};
    let totalCount = parseInt(count || dataTotalCount['totalCount']);
    this.conf.pagination.totalCount = totalCount || this.conf.pagination.totalCount;
    // this.setPageCount();
  }

  this.setPageSize = size => {
    let dataPageSize = this.parseDataAtt('data-mf-pgn');
    dataPageSize = dataPageSize != null ? parseInt(dataPageSize['pageSize']) : {};
    let pageCount = parseInt(size || dataPageSize['pageSize']);
    this.conf.pagination.pageSize = pageCount || this.conf.pagination.pageSize;
  }

  this.setPageCount = count => {
    let dataCount = this.parseDataAtt('data-mf-pgn');
    dataCount = dataCount != null ? dataCount['pageCount'] : {};
    let pageCount = parseInt(count || dataCount['pageCount']);
    this.pageCount = pageCount || Math.floor(this.conf.pagination.totalCount / this.conf.pagination.pageSize) || this.conf.pagination.pageCount  || 1;
    this.activePage = this.activePage > pageCount ? pageCount : this.activePage;
  }

  this.setPaginationParameters = () => {
    let dataPagination = this.parseDataAtt('data-mf-pgn');
    if(dataPagination != null) {
      Object.assign(this.conf.pagination, dataPagination);
    }
  }

  this.setPaginationModel = () => {
    let dataModel = this.parseDataAtt('data-mf-pgn-model');
    if(dataModel != null) {
      Object.assign(this.conf.paginationModel, dataModel);
    }
  }

  // METHODS
  // --------------------------------------------------
  this.readystatechange = () => {
    if (this.xhttp.readyState === XMLHttpRequest.DONE) {
      if (this.xhttp.status === 200) {

        let response = this.xhttp.response;
        if(this.paginationEnabled) {
          this.setPageSize(this.xhttp.response[this.conf.paginationModel.pageSize]);
          this.setTotalCount(this.xhttp.response[this.conf.paginationModel.totalCount]);
          this.setPageCount(this.xhttp.response[this.conf.paginationModel.pageCount]);

          if(this.paginationEnabled){
            if(this.conf.pagination.type == paginationTypes.PAGE) {
              this.renderPagination();
            }
            if(this.conf.pagination.type == paginationTypes.LOAD) {
              this.renderLoadMore();
            }
          } 
          response = this.xhttp.response[this.conf.paginationModel.response] || response;
        }
        this.conf.response(response);
      } else {
        console.error(`${messagePrefix} There was a problem with the request. status code: ${this.xhttp.status}`);
      }
    }
  }

  this.loadstart = () => {
    //set timeout ???
    this.conf.container.classList.add('mf-loading');
    this.conf.beforesend();
    this.IsBusy = true;
  }

  this.loadend = () => {
    //clear timeout ???
    setTimeout(() => {
      this.conf.container.classList.remove('mf-loading');
      this.IsBusy = false;
    }, 300);
  }

  this.setData = () => {
    const form = this.conf.form;
    let data = this.getFormData(form);

    if (data === null) {
      console.error(`${messagePrefix} Parsing form didn't gather data, make sure you add 'name' attribute to <input> elements`);
      return false;
    }

    if (this.conf.queryParams === true) {
      this.setQueryParams(data);
    }

    const params = {
      url: form.action,
      method: form.method,
      data: data
    };

    this.sendFormData(params);
  }

  this.sendFormData = params => {
    if (params.method.toLowerCase() == 'post') {
      this.xhttp.open(params.method, params.url, true);
      this.xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      this.xhttp.send(params.data);
    } else {
      const url = params.url + '?' + params.data;
      this.xhttp.open(params.method, url, true);
      this.xhttp.send();
    }
  }

  this.getFormData = form => {
    let data = '';
    for (let item of form.elements) {
      if (item.attributes.name != undefined && item.attributes.name.value.trim() != '' && item.value != '') {
        if((item.type == FormTypes.CHECKBOX || item.type == FormTypes.RADIO) && item.checked == false) {
          continue;
        }
        if(item.type == FormTypes.SUBMIT && item.dataset.selected != "true") {
          continue;
        }
        data += item.attributes.name.value + '=' + encodeURIComponent(item.value) + '&';
      }
    }
    if(this.paginationEnabled) {
      let setting = this.conf.pagination;
      let model = this.conf.paginationModel;

      if(model.pageSize !== null) {
        data += model.pageSize + '=' + setting.pageSize + '&';
      }
      if(model.pageNumber !== null) {
        data += model.pageNumber + '=' + this.activePage + '&';
      }
    }
    return data != '' ? data.slice(0, -1) : null;
  }

  this.setQueryParams = queryParams => {
    let url = location.pathname;
    if (url.slice(-1) == '/') {
      url = url.slice(0, -1) + '?';
    } else {
      url += '?';
    }
    url += queryParams;
    window.history.replaceState(null, '', url);
  }

  this.setPage = e => {
    if(this.IsBusy) {
      return false;
    }
    let currentPage = this.activePage;
    const page = e.currentTarget.getAttribute('data-mf-pgn-page');
    switch(page) {
      case 'first':
        this.activePage = 1;
        break;

      case 'prev':
        this.activePage = this.activePage > 1 ? this.activePage - 1 : 1;
        break;
      
      case 'next':
        this.activePage = this.activePage < this.pageCount ? this.activePage + 1 : this.pageCount;
        break;
      
      case 'last':
        this.activePage = this.pageCount;
        break;

      default:
        this.activePage = parseInt(page);
        break;
    }
    if(this.activePage == currentPage) {
      return false;
    }
    this.setData();
  }

  this.getRenderConfig = () => {
    let symbol = this.conf.pagination.pattern.match(/[0-9]{1,2}/);
    let range = symbol != null && symbol.length ? parseInt(symbol[0]) : null;

    if(range == null) {
      element = null;
      console.error(`${messagePrefix} Parameter number of pages is not a number`);
      return {
        firstDot: false,
        firstBtn: false,
        lastBtn: false,
        lastDot: false,
        rangeStart: 0,
        rangeStop: -1
      };
    }

    if(this.pageCount - range <= 1) {
      return {
        firstDot: false,
        firstBtn: false,
        lastBtn: false,
        lastDot: false,
        rangeStart: 1,
        rangeStop: this.pageCount
      }
    }

    let offset = 0 // to be used in case of even display number | range % 2 == 0 ? 1 : 0;

    let halfRange = Math.floor(range / 2);

    let pagStart = this.activePage - (halfRange + offset);

    if(pagStart < halfRange) {
      pagStart = 1;
    }

    let pagStop = (pagStart + range) - 1;

    if(this.pageCount - pagStop < 1) {
      pagStart = (this.pageCount - range) + 1;
      pagStop = this.pageCount;
    }

    let renderFirstDots = pagStart > 2 ? true : false;
    let renderFirstBtn = pagStart > 1 ? true : false;
    let renderLastDots = pagStop < this.pageCount - 1 ? true : false;
    let renderLastBtn = pagStop < this.pageCount ? true : false;

    return {
      firstDot: renderFirstDots,
      firstBtn: renderFirstBtn,
      lastDot: renderLastDots,
      lastBtn: renderLastBtn,
      rangeStart: pagStart,
      rangeStop: pagStop
    }
  }

  this.renderPagination = () => {
    this.conf.pagination.container.innerHTML = '';
    let elements = this.conf.pagination.pattern.split(' ');

    let render = this.getRenderConfig();

    elements.forEach(item => {
      let element = '';
      let btn = '';
      let dots = '';
      switch (item) {
        case '<<':
          element = '<button class="mf-pgn-btn mf-pgn-first" data-mf-pgn-page="first"><span class="mf-icon-first"></span></button>';
          break;

        case '<':
          element = '<button class="mf-pgn-btn mf-pgn-prev" data-mf-pgn-page="prev"><span class="mf-icon-prev"></span></button>';
          break;

        case '>':
          element = '<button class="mf-pgn-btn mf-pgn-next" data-mf-pgn-page="next"><span class="mf-icon-next"></span></button>';
          break;

        case '>>':
          element = '<button class="mf-pgn-btn mf-pgn-last" data-mf-pgn-page="last"><span class="mf-icon-last"></span></button>';
          break;

        case '>...':
          btn = render.firstBtn ? `<button class="mf-pgn-btn" data-mf-pgn-page="first">1</button>` : '';
          dots = render.firstDot ? `<span class="mf-pgn-dots">...</span>` : '';
          element = btn + dots;
          break;
          
        case '...<':
          btn = render.lastBtn ? `<button class="mf-pgn-btn" data-mf-pgn-page="last">${this.pageCount}</button>` : '';
          dots = render.lastDot ? `<span class="mf-pgn-dots">...</span>` : '';
          element = dots + btn;
          break;

        case '(x/y)':
          element = `<span class="mf-pgn-count">${this.activePage} / ${this.pageCount}</span>`;
          break;

        case '...':
          element = '<span class="mf-pgn-dots">...</span>';
          break;

        case '~':
          element = '<span class="mf-pgn-space"></span>';
          break;
      
        default:
          for(let i = render.rangeStart; i <= render.rangeStop; i++) {
            element = element + `<button class="mf-pgn-btn${this.activePage == i ? ' active' : ''}" data-mf-pgn-page="${i}">${i}</button>`;
          }
          break;
      }

      if (element !== null) {
        this.conf.pagination.container.insertAdjacentHTML('beforeend', element);
      }
    });

    document.querySelectorAll('[data-mf-pgn-page]').forEach(item => {
      item.addEventListener('click', this.setPage);
    });
  }

  this.renderLoadMore = () => {
    this.conf.pagination.container.innerHTML = '';
    if(this.activePage >= this.pageCount) {
      return false;
    }
    let button = '<button class="mf-pgn-btn mf-pgn-load-more" data-mf-pgn-page="next">Load More</button>';
    this.conf.pagination.container.insertAdjacentHTML('beforeend', button);
    document.querySelector('[data-mf-pgn-page]').addEventListener('click', this.setPage);
  }

  this.setInfiniteScroll = () => {
    document.addEventListener('scroll', e => {
      if(this.IsBusy) {
        return false;
      }
      if(this.conf.container.getBoundingClientRect().bottom - window.innerHeight < 150 && this.activePage < this.pageCount) {
        this.activePage++;
        this.setData();
      }
    });
  }

  this.initPagination = () => {
    this.setPaginationParameters();
    this.setPaginationModel();

    this.paginationEnabled = this.conf.pagination.type === paginationTypes.NONE ? false : true;

    if(!this.paginationEnabled) {
      return false;
    }

    this.setPaginationContainer();
    this.setPageCount();

    switch(this.conf.pagination.type) {
      case paginationTypes.PAGE:
        this.renderPagination();
        break;
      case paginationTypes.SCROLL:
        this.setInfiniteScroll();
        break;
      case paginationTypes.LOAD:
        this.renderLoadMore();
        break;
    }
  }

  this.setValuesFromQueryString = () => {
    
    let searchParams = new URLSearchParams(window.location.search);
    for(var pair of searchParams.entries()) {

      switch(pair[0]) {
        case this.conf.paginationModel['pageNumber']:
          this.activePage = pair[1];
          break;

        case this.conf.paginationModel['pageSize']:
          this.setPageSize(pair[1]);
          break;

        case this.conf.paginationModel['pageCount']:
          this.setPageCount(pair[1]);
          break;

        default:
          try {
            document.querySelectorAll(`[name=${pair[0]}]`).forEach(element => {
              switch(element.type) {
                case FormTypes.CHECKBOX:
                case FormTypes.RADIO:
                  element.checked = element.value == pair[1] ? true : false;
                  break;
  
                case FormTypes.SUBMIT:
                  element.value == pair[1] ? element.setAttribute('data-selected', 'true') : null;
                  break;
  
                default:
                  element.value = pair[1];
                  break;
              }
            });
          } catch (e) {
            return false;
          }
          break;
      }
    }
    if(this.paginationEnabled && this.conf.pagination.type == paginationTypes.PAGE) {
      this.renderPagination();
    }
  }

  // CONSTRUCTOR
  // --------------------------------------------------
  (() => {
    let pagination = Object.assign({}, baseConfig.pagination, config.pagination);
    let paginationModel = Object.assign({}, baseConfig.paginationModel, config.paginationModel);
    this.conf = Object.assign(baseConfig, config, { pagination: pagination }, { paginationModel: paginationModel });

    this.setForm(this.conf.form);
    this.setContainer();
    this.setQueryParamsSettings();
    this.initPagination();

    this.setValuesFromQueryString();

    this.xhttp.onreadystatechange = this.readystatechange;
    this.xhttp.onloadstart = this.loadstart;
    this.xhttp.onloadend = this.loadend;

    this.events.forEach(eventName => {
      this.conf.form.addEventListener(eventName, (e) => {
        e.preventDefault();
        if(eventName === 'submit' && e.submitter.name) {
          document.querySelectorAll(`[name="${e.submitter.name}"]`).forEach(element => {
            element.removeAttribute('data-selected');
          });
          e.submitter.setAttribute('data-selected', 'true');
        }
        this.setData();
      });
    });
  })();

  return this;
}

document.querySelectorAll('[data-mf-init]').forEach(form => {
  new AjaxForm({form: form});
});

// Convert container & response to accept "String" or "Function" in order do add default response function on one place

// Example
new AjaxForm({
  form: '.mf-init',
  container: '.mf-response-container',
  // additionalData: {
  //  lng: document.getElementById('language').value,
  // },
  queryParams: true,
  pagination: {
    // type: 'load-more',
    type: 'pagination',
    pattern: '<< < ~ >... [4] ...< ~ > >>',
    // pattern: '< (x/y) >',
    container: '.mf-pagination',
    // pageSize: 10,
    // totalCount: 90
    pageCount: 9
  },
  paginationModel: { //pagination mapping
    totalCount: 'Ukupno'
  },
  beforesend: () => {
    // Add code
  },
  // response: function (res) {
  //   console.log(res);
  // }
});

//u slucaju da su podaci zavuceni u objekte, splituj po tacki i ispitaj kao sto je napisano dole
// obj['key']['key2']