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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users &amp; admins</h1>
        <p className="text-gray-600">
          Manage accounts and access roles for password, email-link, and Google sign-ins.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Total accounts" value={accounts.length} icon={Users} />
        <SummaryCard label="Users" value={userCount} icon={Users} />
        <SummaryCard label="Admins" value={adminCount} icon={ShieldCheck} />
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="p-12">
            <Loader text="Loading accounts..." />
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-12 text-center text-gray-600">No accounts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-purple-50 text-xs uppercase tracking-wide text-purple-800">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Sign-in method</th>
                  <th className="px-6 py-3 text-left">Role</th>
                  <th className="px-6 py-3 text-left">Joined</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {accounts.map((account) => {
                  const key = `${account.source}:${account.id}`;
                  return (
                    <tr key={key} className="hover:bg-purple-50/40">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {account.fullName || account.email}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{account.email}</td>
                      <td className="px-6 py-4 capitalize text-gray-600">{account.provider}</td>
                      <td className="px-6 py-4">
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
                      <td className="whitespace-nowrap px-6 py-4 text-gray-600">
                        {new Date(account.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
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
