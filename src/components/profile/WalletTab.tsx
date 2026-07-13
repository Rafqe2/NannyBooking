"use client";

import { useEffect, useState } from "react";
import { WalletService, Wallet, WalletTransaction } from "../../lib/walletService";
import { useEscapeKey } from "../../lib/useEscapeKey";
import { useTranslation } from "../LanguageProvider";

type TxType = WalletTransaction["type"];
const TYPE_KEYS: Record<TxType, string> = {
  topup: "wallet.type.topup",
  spend: "wallet.type.spend",
  refund: "wallet.type.refund",
  bonus: "wallet.type.bonus",
};

const TYPE_COLORS: Record<WalletTransaction["type"], string> = {
  topup:  "text-green-600 bg-green-50 border-green-200",
  spend:  "text-red-600 bg-red-50 border-red-200",
  refund: "text-blue-600 bg-blue-50 border-blue-200",
  bonus:  "text-brand-600 bg-brand-50 border-brand-200",
};

const TYPE_SIGN: Record<WalletTransaction["type"], string> = {
  topup: "+", spend: "-", refund: "+", bonus: "+",
};

const PRESET_AMOUNTS = [10, 25, 50, 100];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function AddFundsModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<number | null>(25);
  const [custom, setCustom] = useState("");
  const amount = custom !== "" ? parseFloat(custom) : selected;

  useEscapeKey(onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-brand-200 text-[10px] font-bold tracking-[0.2em] uppercase">{t("wallet.badge")}</p>
            <h2 className="text-white font-bold text-lg">{t("wallet.addFunds")}</h2>
          </div>
          <button onClick={onClose} className="text-brand-200 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Preset amounts */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t("wallet.selectAmount")}</p>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => { setSelected(amt); setCustom(""); }}
                  className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                    selected === amt && custom === ""
                      ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                      : "bg-white text-gray-700 border-gray-200 hover:border-brand-300"
                  }`}
                >
                  €{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t("wallet.customAmount")}</p>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium">€</span>
              <input
                type="number"
                min="1"
                max="500"
                placeholder="0.00"
                value={custom}
                onChange={(e) => { setCustom(e.target.value); setSelected(null); }}
                className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Summary */}
          {amount && amount > 0 && (
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              <span className="text-sm text-gray-600">{t("wallet.youWillReceive")}</span>
              <span className="text-lg font-bold text-brand-700">€{amount.toFixed(2)}</span>
            </div>
          )}

          {/* CTA */}
          <button
            disabled
            className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm opacity-60 cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            {t("wallet.proceedToPayment")}
          </button>
          <p className="text-center text-xs text-gray-400">
            {t("wallet.paymentComingSoon")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function WalletTab({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const typeLabel = (type: TxType) => t(TYPE_KEYS[type]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    (async () => {
      const [w, txs] = await Promise.all([
        WalletService.getWallet(userId),
        WalletService.getTransactions(userId),
      ]);
      if (!active) return;
      setWallet(w);
      setTransactions(txs);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {showAddFunds && <AddFundsModal onClose={() => setShowAddFunds(false)} />}

      <div className="space-y-5">
        {/* Balance card */}
        <div className="bg-gradient-to-r from-brand-600 via-brand-700 to-brand-600 rounded-2xl p-6 text-white shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-brand-200 text-xs font-bold tracking-[0.2em] uppercase mb-2">
                {t("wallet.availableBalance")}
              </p>
              <p className="text-4xl font-bold tracking-tight">
                €{(wallet?.balance ?? 0).toFixed(2)}
                <span className="text-lg font-normal text-brand-300 ml-1">{wallet?.currency ?? "EUR"}</span>
              </p>
              <p className="text-brand-300 text-xs mt-2">
                {t("wallet.transactionsCount", { count: transactions.length })}
              </p>
            </div>
            <button
              onClick={() => setShowAddFunds(true)}
              className="flex-shrink-0 flex items-center gap-1.5 bg-white text-brand-700 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-brand-50 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t("wallet.addFunds")}
            </button>
          </div>
        </div>

        {/* Transaction history */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">{t("wallet.transactionHistory")}</h3>
            {transactions.length > 0 && (
              <span className="text-xs text-gray-400">{t("wallet.totalCount", { count: transactions.length })}</span>
            )}
          </div>

          {transactions.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">{t("wallet.noTransactions")}</p>
              <p className="text-xs text-gray-400 mt-1">{t("wallet.addToStart")}</p>
              <button
                onClick={() => setShowAddFunds(true)}
                className="mt-4 inline-flex items-center gap-1.5 text-brand-600 text-sm font-medium hover:underline"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t("wallet.addFirstFunds")}
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${TYPE_COLORS[tx.type]}`}>
                      {typeLabel(tx.type)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 truncate">{tx.description || typeLabel(tx.type)}</p>
                      <p className="text-xs text-gray-400">{formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold flex-shrink-0 ml-4 ${
                    tx.type === "spend" ? "text-red-600" : "text-green-600"
                  }`}>
                    {TYPE_SIGN[tx.type]}€{tx.amount.toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
