import {
	json,
	type DataFunctionArgs,
} from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { Icon } from '#app/components/ui/icon.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { adminGetAllTenants, type TenantWithWorkspacesAndUsers } from '#app/utils/tenants.db.server.ts'

export const handle = {
	breadcrumb: <Icon name="link-2">Tenants</Icon>,
}

type LoaderData = {
    items: TenantWithWorkspacesAndUsers[];
};

export async function loader({ request }: DataFunctionArgs) {
	await requireUserId(request)

    const items = await adminGetAllTenants();
    const data: LoaderData = {
        items,
    };

    return json(data);
}


export default function Tenants() {
	const data = useLoaderData<typeof loader>()

	return (
		<div className="mx-auto max-w-md">
			{data.items.length ? (
				<div className="flex flex-col gap-2">
					<p>Here are the current tenants:</p>
					<ul className="flex flex-col gap-4">
						{data.items.map(t => (
							<li key={t.id}>
								{t.name}
							</li>
						))}
					</ul>
				</div>
			) : (
				<p>You don't have any tenants yet.</p>
			)}
		</div>
	)
}
