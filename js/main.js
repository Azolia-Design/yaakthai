console.log('Welcome to YAAKTHAI');

const $btnShowCart = $('.cart-button');
const $btnCloseCart = $('.cart-close');
const $btnAddToCart = $('.order-button');

const $inputQuantity = $('input.quantity');
const $cartQuantityBadge = $('.cart-quantity');
const $totalPriceCartEle = $('.cart-total-top .text-18.bold');
const $cartListEle = $('.cart-list');

const $orderListEle = $('.order-item-list');
const $totalPriceOrderEle = $('.total-price');

const $checkoutForm = $('#wf-form-checkout_form');
const $partyForm = $('#party-form');

const portalId = '21519253';
const formId = '33b40444-e243-4a09-b973-8b90621f129a';
const sendSubmissionUrl = `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`;
// Utils START //
function numberWithCommas(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseToNumber(str) {
  return +str || str;
}

function isEmpty(val) {
  return (
    val === undefined ||
    val === null ||
    (typeof val === 'object' && Object.keys(val).length === 0) ||
    (typeof val === 'string' && val.trim().length === 0)
  );
}

function sum(arr, key) {
  return arr.reduce((a, b) => +a + (key ? +b[key] : +b), 0);
}

function mapFormToObject(ele) {
  return (parsedFormData = [...new FormData(ele).entries()].reduce(
    (prev, cur) => {
      const name = cur[0];
      const val = cur[1];
      return { ...prev, [name]: val };
    },
    {}
  ));
}

function getCurrentPage() {
  return window.location.pathname.split('/')[1];
}
// Utils END //

// Fetching CMS START//
function fetchProducts() {
  const parser = new DOMParser();
  return fetch('./ajax-product-collection.html')
    .then((response) => response.text())
    .then((html) => {
      const doc = parser.parseFromString(html, 'text/html');
      products = [...doc.querySelectorAll('.w-dyn-item')].map((ele) => {
        const productItem = [...ele.querySelectorAll('[data-prop]')].reduce(
          (prev, cur) => {
            const name = cur.dataset.prop;
            const value = cur.src || parseToNumber(cur.innerText) || null;
            return { ...prev, [name]: value };
          },
          {}
        );
        return productItem;
      });
    })
}

function getProductById(id) {
  const product = products.find((ele) => ele.id === id);
  return product || {};
}
// Fetching CMS END//

// Cart method START //
const defaultCartData = {
  totalAfterPrice: 0,
  totalQuantity: 0,
  data: [],
};

function getCart() {
  const cart = JSON.parse(localStorage.getItem('cart'));
  if (isEmpty(cart)) {
    localStorage.setItem('cart', JSON.stringify(defaultCartData));
    return defaultCartData;
  }
  return cart;
}

function setCart(data) {
  const totalQuantity = sum(data, 'quantity');
  const totalAfterPrice = sum(data, 'totalAfterPrice');
  const newCart = {
    totalQuantity,
    totalAfterPrice,
    data,
  };
  localStorage.setItem('cart', JSON.stringify(newCart));
}

function resetCart() {
  localStorage.setItem('cart', JSON.stringify(defaultCartData));
}

function addItemToCart(id, quantity) {
  const cartData = getCart().data;
  const existCartItem = cartData.find((e) => e.id === id);
  if (existCartItem) {
    const newQuantity = existCartItem.quantity + quantity;
    existCartItem.quantity = newQuantity;
    existCartItem.totalAfterPrice = existCartItem.afterPrice * newQuantity;

    setCart(cartData);
    return;
  }
  const product = getProductById(id);
  const newCartItem = {
    ...product,
    quantity,
    totalAfterPrice: product.afterPrice * quantity,
  };
  const newCartData = [...cartData, newCartItem];
  setCart(newCartData);
}

function removeItemFromCart(id) {
  const cartData = getCart().data;
  const newCartData = cartData.filter((e) => e.id !== id);
  console.log(newCartData);
  setCart(newCartData);
}

function renderCartItem(cartData) {
  const { name, totalAfterPrice, image, id, quantity } = cartData;
  return `<div class="cart-item">
            <img
              src=${image}
              loading="lazy"
              alt=""
              class="cart-item-img"
            />
            <div class="cart-item-info">
              <div class="heading-3 bold">${name} <span>x ${quantity}</span></div>
              <div class="heading-3">${
                numberWithCommas(totalAfterPrice)
              } VND</div>
              <a href="#" class="cart-item-remove" data-id=${id}>Xóa</a>
            </div>
          </div>`;
}

function renderOrderItem(cartData) {
  const { name, totalAfterPrice, image, quantity } = cartData;
  return `<div class="order-item">
            <img
              src=${image}
              alt=""
              class="w-commerce-commercecartitemimage order-image"
            />
            <div class="item-info">
              <div class="text-15 bold">${name}</div>
              <div class="w-commerce-commercecheckoutorderitemquantitywrapper">
                <div class="text-15">Số lượng:&nbsp;</div>
                <div class="text-15">${quantity}</div>
              </div>
            </div>
            <div class="text-18">${numberWithCommas(totalAfterPrice)} VND</div>
          </div>
          `;
}

function renderCart() {
  const cart = getCart();
  const cartItemHtml = cart.data.map(renderCartItem);
  if (isEmpty(cart.data)) {
    $('.cart-actions').hide();
    const cartEmptyEle = `<div class="order-item"><p>Your cart is empty</p></div>`;
    $cartListEle.html(cartEmptyEle);
    $cartQuantityBadge.text(cart.totalQuantity);
    return;
  }
  $('.cart-actions').show();
  $totalPriceCartEle.text(`${numberWithCommas(cart.totalAfterPrice)} VND`);
  $cartQuantityBadge.text(cart.totalQuantity);
  $cartListEle.html(cartItemHtml.join(' '));

  $('.cart-item-remove').on('click', function (e) {
    e.preventDefault();
    const id = $(this).data('id');
    removeItemFromCart(id);
    renderCart();
  });
}
renderCart();

function renderOrderList() {
  const currentPage = getCurrentPage();
  if (currentPage === 'payment.html') {
    $('.cart').remove();

    const cart = getCart();
    if (isEmpty(cart.data)) {
      window.history.back();
      return;
    }
    const orderItemHtml = cart.data.map(renderOrderItem);

    $totalPriceOrderEle.text(`${numberWithCommas(cart.totalAfterPrice)} VND`);
    $orderListEle.html(orderItemHtml.join(' '));
  }
}
renderOrderList();

// Cart method END //

function handleCartVisible() {
  $btnShowCart.on('click', (e) => {
    e.preventDefault();
    $('.cart-wrap, .cart-container').addClass('show');
  });

  $('.cart-wrap').on('click', (e) => {
    if ($('.cart-container').is(":hover") == false) {
      e.preventDefault();
      $('.cart-wrap').removeClass('show');
      $('.cart-container').removeClass('show'); 
    }
  })

  $btnCloseCart.on('click', (e) => {
    e.preventDefault();
    $('.cart-wrap, .cart-container').removeClass('show');
  });
}
handleCartVisible();

function handleAddToCart() {
  $btnAddToCart.on('click', function (e) {
    e.preventDefault();
    const quantity = $(this).closest('.add-to-cart').find($inputQuantity).val();
    const id = $(this).data('id');
    addItemToCart(id, +quantity);
    renderCart();
  });
}
handleAddToCart();

function checkoutSuccess() {
  $('.form-done-wrap').addClass('show');
  //$('#wf-form-checkout_form').hide();

  resetCart();
  renderCart();
}

// function partySuccess() {
//   $('.form-done-wrap').addClass('show');
// }

// $('.btn-close').on('click', (e) => {
//   e.preventDefault();
//   $('.form-done-wrap').removeClass('show');
//   $('.pop-up').css('opacity','0');
//   $('.pop-up').css('display','none');
// })

function checkoutError(error) {
  const errorResponse = error.responseJSON;
  const errorDetails = errorResponse.errors;
  const invalidEmailError = errorDetails.find(
    ({ errorType }) => errorType === 'INVALID_EMAIL'
  );
  if (isEmpty(invalidEmailError)) {
    alert('Đã có lỗi xảy rạ Bạn hãy thử lại nhé ^^!');
    return;
  }
  alert('Your email is invalid. Please try again');
}

// function partyError(error) {
//   const errorResponse = error.responseJSON;
//   const errorDetails = errorResponse.errors;
//   const invalidEmailError = errorDetails.find(
//     ({ errorType }) => errorType === 'INVALID_EMAIL'
//   );
//   if (isEmpty(invalidEmailError)) {
//     alert('Đã có lỗi xảy rạ Bạn hãy thử lại nhé ^^!');
//     return;
//   }
//   alert('Your email is invalid. Please try again');
// }

function handleCheckout() {
  const cart = getCart();
  const cartData = cart.data;

  const parseCartData = cartData.map((item) => {
    return `${item.name} x${item.quantity} --- ${numberWithCommas(
      item.totalAfterPrice
    )} VND`;
  });

  const totalAfterPrice = cart.totalAfterPrice;
  const totalQuantity = cart.totalQuantity;

  $checkoutForm.on('submit', (e) => {
    e.preventDefault();
    const formObject = mapFormToObject(e.target);
    console.log(parseCartData);
    const data = {
      fields: [
        {
          name: 'customer_info',
          value: `${formObject.full_name} - ${formObject.phone}`,
        },
        {
          name: 'email',
          value: formObject.email,
        },
        {
          name: 'address',
          value: `${formObject.address}`,
        },
        {
          name: 'product_info',
          value: parseCartData.join('\n'),
        },
        {
          name: 'price_info',
          value: `Total Quantity: ${totalQuantity} \n Total Price: ${numberWithCommas(
            totalAfterPrice
          )} VND`,
        },
      ],
      context: {
        pageUri: window.location.href,
        pageName: 'Cart checkout',
      },
    };
    const final_data = JSON.stringify(data);
    $.ajax({
      url: sendSubmissionUrl,
      method: 'POST',
      data: final_data,
      dataType: 'json',
      headers: {
        accept: 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      contentType: 'application/json',
      success: function (response) {
        checkoutSuccess();
      },
      error: function (error) {
        checkoutError(error);
      },
    });
  });
}
handleCheckout();

// function handleParty() {
//   $partyForm.on('submit', (e) => {
//     e.preventDefault();
//     console.log(parseCartData);
//     const data = {
      
//     };
//     const final_data = JSON.stringify(data);
//     $.ajax({
//       url: sendSubmissionUrl,
//       method: 'POST',
//       data: final_data,
//       dataType: 'json',
//       headers: {
//         accept: 'application/json',
//         'Access-Control-Allow-Origin': '*',
//       },
//       contentType: 'application/json',
//       success: function (response) {
//         partySuccess();
//       },
//       error: function (error) {
//         partyError(error);
//       },
//     });
//   });
// }

window.onload = () => {
  fetchProducts().then(() => {
    // Put your main code need products here
    console.log(products);
  });
};
