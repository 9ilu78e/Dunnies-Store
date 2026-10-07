"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Trash2, Users } from "lucide-react";
import Loader from "@/components/ui/Loader";
import DeleteModal from "@/components/ui/DeleteModal";

type AccountSource = "user" | "firebaseUser";

interface Account {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  source: AccountSource;
  provider: string;
}

export default function ManageUsers() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingAccount, setUpdatingAccount] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch accounts");
      }
      setAccounts(data.accounts || []);
      setError(null);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load accounts");
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAccounts();
  }, []);

  const handleRoleChange = async (account: Account, role: string) => {
    const key = `${account.source}:${account.id}`;
    setUpdatingAccount(key);
    setError(null);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: account.id, source: account.source, role }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update role");
      }
      await fetchAccounts();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update role");
    } finally {
      setUpdatingAccount(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;
    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(selectedAccount.id)}?source=${selectedAccount.source}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to remove account");
      }
      setDeleteModalOpen(false);
      setSelectedAccount(null);
      await fetchAccounts();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to remove account");
    } finally {
      setIsDeleting(false);
    }
  };

  const adminCount = accounts.filter(
    (account) => account.role.toLowerCase() === "admin"
  ).length;
  const userCount = accounts.length - adminCount;

  return (
    <div className="w-full min-w-0 space-y-5 py-1 sm:space-y-6 sm:py-2">
      <div className="min-w-0">
        <h1 className="break-words bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-2xl font-bold text-transparent sm:text-4xl">
          Users &amp; admins
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 sm:text-lg">
          Manage accounts and access roles for password, email-link, and Google sign-ins.
        </p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <SummaryCard label="Total accounts" value={accounts.length} icon={Users} />
        <SummaryCard label="Users" value={userCount} icon={Users} />
        <SummaryCard label="Admins" value={adminCount} icon={ShieldCheck} />
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm sm:rounded-3xl">
        {loading ? (
          <div className="p-6 sm:p-12">
            <Loader text="Loading accounts..." />
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-6 text-center text-gray-600 sm:p-12">No accounts found.</div>
        ) : (
          <>
          <div className="space-y-3 p-3 md:hidden">
            {accounts.map((account) => {
              const key = `${account.source}:${account.id}`;
              return (
                <article key={key} className="min-w-0 rounded-xl border border-purple-100 bg-white p-3 shadow-sm">
                  <div className="min-w-0">
                    <h2 className="break-words text-sm font-semibold text-gray-900">
                      {account.fullName || account.email}
                    </h2>
                    <p className="mt-1 break-all text-xs text-gray-600">{account.email}</p>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <div className="min-w-0">
                      <dt className="text-gray-500">Sign-in method</dt>
                      <dd className="mt-0.5 truncate capitalize font-medium text-gray-800">
                        {account.provider}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Joined</dt>
                      <dd className="mt-0.5 font-medium text-gray-800">
                        {new Date(account.createdAt).toLocaleDateString()}
                      </dd>
                    </div>
                    <div className="col-span-2 flex items-center justify-between gap-3 border-t border-gray-100 pt-2">
                      <div>
                        <dt className="text-gray-500">Role</dt>
                        <dd className="mt-1">
                          <label className="sr-only" htmlFor={`role-${key}`}>
                            Role for {account.email}
                          </label>
                          <select
                            id={`role-${key}`}
                            value={account.role.toLowerCase()}
                            disabled={updatingAccount === key}
                            onChange={(event) => void handleRoleChange(account, event.target.value)}
                            className={`rounded-full border-0 px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-60 ${
                              account.role.toLowerCase() === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-pink-50 text-pink-800"
                            }`}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </dd>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAccount(account);
                          setDeleteModalOpen(true);
                        }}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
          <div className="hidden min-w-0 overflow-x-auto md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-purple-50 text-xs uppercase tracking-wide text-purple-800">
                <tr>
                  <th className="px-3 py-3 text-left sm:px-6">Name</th>
                  <th className="px-3 py-3 text-left sm:px-6">Email</th>
                  <th className="px-3 py-3 text-left sm:px-6">Sign-in method</th>
                  <th className="px-3 py-3 text-left sm:px-6">Role</th>
                  <th className="px-3 py-3 text-left sm:px-6">Joined</th>
                  <th className="px-3 py-3 text-right sm:px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {accounts.map((account) => {
                  const key = `${account.source}:${account.id}`;
                  return (
                    <tr key={key} className="hover:bg-purple-50/40">
                      <td className="px-3 py-4 font-semibold text-gray-900 sm:px-6">
                        {account.fullName || account.email}
                      </td>
                      <td className="px-3 py-4 text-gray-600 sm:px-6">{account.email}</td>
                      <td className="px-3 py-4 capitalize text-gray-600 sm:px-6">{account.provider}</td>
                      <td className="px-3 py-4 sm:px-6">
                        <label className="sr-only" htmlFor={`role-${key}`}>
                          Role for {account.email}
                        </label>
                        <select
                          id={`role-${key}`}
                          value={account.role.toLowerCase()}
                          disabled={updatingAccount === key}
                          onChange={(event) => void handleRoleChange(account, event.target.value)}
                          className={`rounded-full border-0 px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-60 ${
                            account.role.toLowerCase() === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-pink-50 text-pink-800"
                          }`}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-gray-600 sm:px-6">
                        {new Date(account.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-4 text-right sm:px-6">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAccount(account);
                            setDeleteModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      <DeleteModal
        isOpen={deleteModalOpen}
        title="Remove account"
        message={`Remove ${selectedAccount?.fullName || selectedAccount?.email || "this account"} permanently?`}
        onConfirm={() => void handleDeleteAccount()}
        onCancel={() => {
          setDeleteModalOpen(false);
          setSelectedAccount(null);
        }}
        isLoading={isDeleting}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 text-purple-700">
        <Icon className="h-5 w-5" />
      </span>
    </div>
  );
}
