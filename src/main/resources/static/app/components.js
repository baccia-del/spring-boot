const WARENKORB='warenkorb', LANG='lang', MESSAGES='messages_'
const index = location.search.indexOf('lang=')
const	lang = (index==-1)? localStorage.getItem(LANG)||'de' : location.search.substring(index + 5, index + 7).toLowerCase()
const i18n = new VueI18n({
	locale: lang,
	messages: {},
})

function loadLanguage(locale) {
	locale = locale || lang
	const msgStorage = sessionStorage.getItem(MESSAGES + locale)
	if (msgStorage) {
		setMessages(locale, JSON.parse(msgStorage))
		return new Promise(resolve => setTimeout(resolve, 0))
	} else {
		return fetch("/app/messages?lang=" + locale, {headers: {"Content-Type": "application/json"}})
			.then(res => res.json())
			.then(msgServer => {
				console.log('loading from Server')
				setMessages(locale, msgServer)
				sessionStorage.setItem(MESSAGES + locale, JSON.stringify(msgServer))
			})
	}
}
function setMessages(locale, messages) {
	i18n.setLocaleMessage(locale, messages)
	i18n.locale = locale
	localStorage.setItem(LANG, locale)
	document.querySelector('html').setAttribute('lang', locale)
}

const AppHeader = {
	name: 'app-header',
	i18n,
	template:
	`<header class="mdl-layout__header mdl-layout__header--waterfall portfolio-header">
		<div class="mdl-layout__header-row portfolio-logo-row">
				<h1 v-t="'title.shop'"></h1>
		</div>
		<div class="mdl-layout__header-row portfolio-navigation-row mdl-layout--large-screen-only">
			<nav class="mdl-navigation mdl-typography--body-1-force-preferred-font">
				<a href="index.html" class="mdl-navigation__link" :class="{'is-active':active=='index'}" v-t="'nav.portfolio'"></a>
				<a href="cart.html"  class="mdl-navigation__link" :class="{'is-active':active=='cart'}">
					<span class="mdl-badge" :data-badge="cartItems" v-t="'nav.cart'"></span>
				</a>
				<a v-if="cartItems>0"	href="checkout.html" class="mdl-navigation__link" 
					:class="{'is-active':active=='checkout'}">
					{{$t('button.checkout')}}
					<i class="material-icons">exit_to_app</i>
				</a>
				<a href="orders.html" class="mdl-navigation__link" :class="{'is-active':active=='orders'}" v-t="'nav.orders'"></a>
				<a v-if="kundenId"	href="customer.html" class="mdl-navigation__link" :class="{'is-active':active=='customer'}" v-t="'nav.account'"></a>
				<span>
					{{$t('lang.change')}}<br/>
					<select id="locales" v-model="lang">
						<option value="en" v-t="'lang.en'"></option>
						<option value="de" v-t="'lang.de'"></option>
					</select>
				</span>
				<a href="/login" class="mdl-navigation__link" v-t="'nav.login'"></a>
			</nav>
		</div>
	</header>`,
	props: ['active', 'title', 'badge'],
	data: function() {
		return {
			lang: lang,
			warenkorb: {
				produkte: [],
				gesamtzahl: 0
			}
		}
	},
	watch: {
		lang: function(newValue) {
			loadLanguage(newValue).then(() => document.title = i18n.t(this.title))
		}
	},
	methods: {},
	computed: {
		cartItems: function() {
			if (this.badge != null)
				return this.badge
			return this.warenkorb.gesamtzahl
		},
		kundenId: function() {
			return localStorage.getItem('kundenId')
		}
	},
	created: function() {
		let localWarenkorb = sessionStorage.getItem(WARENKORB)
		if (localWarenkorb) {
			this.warenkorb = JSON.parse(localWarenkorb)
		}
		document.title = i18n.t(this.title)
	},
	style: ``
}

const Drawer = {
	name: 'drawer',
	i18n,
	template: `<div class="mdl-layout__drawer mdl-layout--small-screen-only">
	<nav class="mdl-navigation mdl-typography--body-1-force-preferred-font">
		<a class="mdl-navigation__link" href="index.html" v-t="'nav.portfolio'"></a>
		<a class="mdl-navigation__link" href="cart.html" v-t="'nav.cart'"></a>
		<a class="mdl-navigation__link" href="checkout.html" v-t="'button.checkout'"></a>
		<a class="mdl-navigation__link" href="orders.html" v-t="'nav.orders'"></a>
		<a class="mdl-navigation__link" href="customer.html" v-t="'nav.account'"></a>
		<a class="mdl-navigation__link" href="/login" v-t="'nav.login'"></a>
	</nav>
</div>`
}

const AppFooter = {
	name: 'app-footer',
	i18n,
	template:
	`<footer class="mdl-mini-footer">
		<div class="mdl-mini-footer__left-section">
			<div class="mdl-logo">
        <a href="/index.html" v-t="'footer.title'"></a>
			</div>
		</div>
		<div class="mdl-mini-footer__right-section">
			<ul class="mdl-mini-footer__link-list">
				<li><a href="about.html" v-t="'nav.about'"></a></li>
				<li><a href="#" v-t="'footer.help'"></a></li>
				<li><a href="#" v-t="'footer.imprint'"></a></li>
			</ul>
		</div>
	</footer>`
}

const Validation = {
	data: function() {
		return {
			kunde: {
				id: '',
				vorname: '',
				nachname: '',
				strasse: '',
				plz: '',
				ort: '',
				email: '',
				sprache: localStorage.getItem(LANG),
				zahlungsart: '',
				iban: '',
				kreditkartenNr: ''
			},
			isInvalid: {
				vorname: false,
				nachname: false,
				strasse: false,
				plz: false,
				ort: false,
				email: false,
				zahlungsart: false,
				iban: false,
				kreditkartenNr: false
			}
		}
	},
	methods: {
		validate: function (e) {
			const fields = ['vorname', 'nachname', 'strasse', 'plz', 'ort', 'email']
			let isValid = true
			for (const index in fields) {
				const key = fields[index]
				if (this.kunde[key] == '') {
					isValid = false
					this.isInvalid[key] = true
				}
			}
			if (isValid) {
				switch (this.kunde.zahlungsart) {
					case null:
						isValid = false
						this.isInvalid.zahlungsart = true
						break
					case '0':
						this.isInvalid.zahlungsart = false
						this.isInvalid.kreditkartenNr = false
						isValid = (this.kunde.iban != '' && this.isValidIBANNumber(this.kunde.iban) == 1)
						this.isInvalid.iban = !isValid
						break
					case '1':
						this.isInvalid.zahlungsart = false
						this.isInvalid.iban = false
						isValid = (this.kunde.kreditkartenNr != '' && this.visaCard(this.kunde.kreditkartenNr))
						this.isInvalid.kreditkartenNr = !isValid
				}
			}
			return isValid
		},
		isValidIBANNumber: function (input) {
			var CODE_LENGTHS = {
				AD: 24, AE: 23, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22, BH: 22, BR: 29,
				CH: 21, CR: 21, CY: 28, CZ: 24, DE: 22, DK: 18, DO: 28, EE: 20, ES: 24,
				FI: 18, FO: 18, FR: 27, GB: 22, GI: 23, GL: 18, GR: 27, GT: 28, HR: 21,
				HU: 28, IE: 22, IL: 23, IS: 26, IT: 27, JO: 30, KW: 30, KZ: 20, LB: 28,
				LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MD: 24, ME: 22, MK: 19, MR: 27,
				MT: 31, MU: 30, NL: 18, NO: 15, PK: 24, PL: 28, PS: 29, PT: 25, QA: 29,
				RO: 24, RS: 22, SA: 24, SE: 24, SI: 19, SK: 24, SM: 27, TN: 24, TR: 26,
				AL: 28, BY: 28, CR: 22, EG: 29, GE: 22, IQ: 23, LC: 32, SC: 31, ST: 25,
				SV: 28, TL: 23, UA: 29, VA: 22, VG: 24, XK: 20
			};
			var iban = String(input).toUpperCase().replace(/[^A-Z0-9]/g, ''), // keep only alphanumeric characters
				code = iban.match(/^([A-Z]{2})(\d{2})([A-Z\d]+)$/), // match and capture (1) the country code, (2) the check digits, and (3) the rest
				digits;
			// check syntax and length
			if (!code || iban.length !== CODE_LENGTHS[code[1]]) {
				return false;
			}
			// rearrange country code and check digits, and convert chars to ints
			digits = (code[3] + code[1] + code[2]).replace(/[A-Z]/g, function (letter) {
				return letter.charCodeAt(0) - 55;
			});
			// final check
			return this.mod97(digits);
		},
		mod97: function (string) {
			var checksum = string.slice(0, 2), fragment;
			for (var offset = 2; offset < string.length; offset += 7) {
				fragment = String(checksum) + string.substring(offset, offset + 7);
				checksum = parseInt(fragment, 10) % 97;
			}
			console.log('checksum', checksum)
			return checksum;
		},
		visaCard: function (inputtxt) {
			var cardno = /^(?:4[0-9]{12}(?:[0-9]{3})?)$/;
			return inputtxt.match(cardno) ? true : false
		},
	}
}