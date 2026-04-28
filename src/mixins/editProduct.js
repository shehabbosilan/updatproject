const stMixin = {
  data() {
    return {
      datas: [],
      updateProduct: {},
    };
  },
  methods: {
    // add product
    async addProduct(product) {
      const request = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      };
      await fetch(`${process.env.VUE_APP_API_URL}/product`, request);
      await this.getProduct();
      console.log("add");
    },
    // get product
    async getProduct() {
      await fetch(`${process.env.VUE_APP_API_URL}/product`)
        .then((res) => res.json())
        .then((data) => (this.datas = data));
    },
    async getOneProduct(id) {
      await fetch(`${process.env.VUE_APP_API_URL}/product/${id}`)
        .then((res) => res.json())
        .then((data) => (this.updateProduct = data));
    },
    // delete product
    async deleteProduct(id) {
      await fetch(`${process.env.VUE_APP_API_URL}/product/${id}`, { method: "DELETE" });
      await this.getProduct();
    },
    // update product
    async updateProducts(product) {
      const request = {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      };
      await fetch(`${process.env.VUE_APP_API_URL}/product`, request);
      await this.getProduct();
      console.log("update");
    },
  },

  async mounted() {
    await this.getProduct();
  },
};
export default stMixin;
