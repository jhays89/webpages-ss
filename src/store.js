const store = {
  data: {
    args: {
      display: 'desktop'
    },
    displayType: {
      mobile: {
        width: 375,
        height: 812,
        description: 'iPhone X'
      },
      desktop: {
        width: 1366,
        height: 768,
        description: 'Common Desktop'
      }
    },
    selectedDisplayType: {}
  },

  setArgs: function (args) {
    this.setDisplayType(args.d);
  },

  setDisplayType: function (type) {
    if(type && type.toUpperCase() === 'MOBILE') {
      this.data.selectedDisplayType = this.data.displayType.mobile;
    } else {
      this.data.selectedDisplayType = this.data.displayType.desktop;
    }
  }
};

module.exports = store;