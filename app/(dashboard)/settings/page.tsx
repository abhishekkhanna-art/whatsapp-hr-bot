import { SettingsPanel } from "@/components/settings-panel";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="border-b bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure Priya&apos;s persona and questions</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <SettingsPanel />
      </div>
    </div>
  );
}
