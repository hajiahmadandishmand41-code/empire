import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-slate-brand text-white pt-12 pb-8 border-t border-gray-700">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-emerald-400 font-bold text-xl">E</span>
              <span className="font-bold text-xl tracking-tight">mpire</span>
            </div>
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
              پلتفرم تجارت الکترونیک چندفروشنده برای افغانستان و بازارهای
              جهانی. خرید و فروش عمده و خرده، بازارگاه، شرکت‌های تجاری وmore.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-4">
              خریداری
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/" className="hover:text-white transition">
                  صفحه اصلی
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-white transition">
                  محصولات
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-white transition">
                  دسته‌بندی‌ها
                </Link>
              </li>
              <li>
                <Link href="/brands" className="hover:text-white transition">
                  برندها
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition">
                  سبد خرید
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-4">
              حساب کاربری
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/account" className="hover:text-white transition">
                  پروفایل من
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="hover:text-white transition">
                  سفارش‌های من
                </Link>
              </li>
              <li>
                <Link href="/account/addresses" className="hover:text-white transition">
                  آدرس‌ها
                </Link>
              </li>
              <li>
                <Link href="/account/favorites" className="hover:text-white transition">
                  علاقه‌مندی‌ها
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-4">
              فروشندگان و شرکت‌ها
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/seller" className="hover:text-white transition">
                  داشبورد فروشنده
                </Link>
              </li>
              <li>
                <Link href="/become-seller" className="hover:text-white transition">
                  فروشنده شوید
                </Link>
              </li>
              <li>
                <Link href="/company" className="hover:text-white transition">
                  حساب شرکت (B2B)
                </Link>
              </li>
              <li>
                <Link href="/rfq" className="hover:text-white transition">
                  درخواست قیمت (RFQ)
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-4">
              قوانین و اطلاعات
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/about" className="hover:text-white transition">
                  درباره ما
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">
                  تماس با ما
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition">
                  شرایط و ضوابط
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition">
                  حریم خصوصی
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-white transition">
                  اطلاعات حمل و نقل
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-white transition">
                  بازگشت کالا
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            Empire — تمام حقوق محفوظ است.
          </p>
          <div className="flex gap-4 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition">
              توییتر
            </a>
            <a href="#" className="hover:text-white transition">
              لینکدین
            </a>
            <a href="#" className="hover:text-white transition">
              اینستاگرام
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
