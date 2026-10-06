import { MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { card, cardTitle, input } from "@/components/styles";
import { ActionForm, SubmitButton } from "@/components/ui";
import { createLocation, deleteLocation, renameLocation } from "@/lib/actions";
import { api } from "@/lib/api";
import { can, requireOrg } from "@/lib/context";
import type { Device, Location } from "@/lib/types";

export const metadata: Metadata = { title: "Locations" };

export default async function LocationsPage() {
  const { org } = await requireOrg();
  const [locations, devices] = await Promise.all([
    api<Location[]>(`/orgs/${org.id}/locations`),
    api<Device[]>(`/orgs/${org.id}/devices`),
  ]);
  const isOwner = can(org, "owner");
  const count = (id: string) =>
    devices.filter((d) => d.locationId === id).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Locations" />
      {isOwner && (
        <section className={card} aria-labelledby="new-location">
          <h2 id="new-location" className={cardTitle}>
            Add a location
          </h2>
          <p className="mt-1 mb-4 text-sm text-muted">
            Rooms, floors, offices or homes inside {org.name}.
          </p>
          <ActionForm
            action={createLocation.bind(null, org.id)}
            className="flex flex-wrap gap-3"
          >
            <label className="min-w-0 flex-1">
              <span className="sr-only">Location name</span>
              <input
                name="name"
                required
                maxLength={255}
                placeholder="e.g. Workshop"
                className={input}
              />
            </label>
            <SubmitButton>Add</SubmitButton>
          </ActionForm>
        </section>
      )}

      <ul className="grid gap-4 md:grid-cols-2">
        {locations.map((location) => (
          <li key={location.id} className={`${card} space-y-4`}>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50">
                <MapPin className="h-5 w-5 text-brand-600" aria-hidden />
              </span>
              <div className="flex-1">
                <p className="font-medium">{location.name}</p>
                <Link
                  href={`/devices?location=${location.id}`}
                  className="text-sm text-brand-700 hover:underline"
                >
                  {count(location.id)} device
                  {count(location.id) === 1 ? "" : "s"}
                </Link>
              </div>
            </div>
            {isOwner && (
              <div className="flex flex-wrap items-start gap-3 border-t border-line pt-4">
                <ActionForm
                  action={renameLocation.bind(null, location.id)}
                  className="flex min-w-0 flex-1 gap-2"
                >
                  <label className="min-w-0 flex-1">
                    <span className="sr-only">Rename {location.name}</span>
                    <input
                      name="name"
                      required
                      maxLength={255}
                      defaultValue={location.name}
                      className={input}
                    />
                  </label>
                  <SubmitButton variant="secondary">Rename</SubmitButton>
                </ActionForm>
                <ActionForm
                  action={deleteLocation.bind(null, location.id)}
                  confirm={`Delete "${location.name}"? Its devices stay, without a location.`}
                >
                  <SubmitButton variant="danger">Delete</SubmitButton>
                </ActionForm>
              </div>
            )}
          </li>
        ))}
      </ul>
      {!locations.length && (
        <p className={`${card} text-center text-sm text-muted`}>
          No locations yet.
        </p>
      )}
    </div>
  );
}
