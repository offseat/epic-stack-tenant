import { faker } from '@faker-js/faker'
import { prisma } from '#app/utils/db.server.ts'
import {
	createPassword,
	createUser,
	getNoteImages,
	getUserImages,
    createTenant,
} from '#tests/db-utils.ts'

async function seed() {
	console.log('🌱 Seeding Tenant...')
	console.time(`🌱 Database has been seeded`)

    const adminRole = await prisma.role.findUnique({ where: { name: 'admin'} })
    await prisma.role.deleteMany({ where: { name: 'tenant' }})
	console.time('👑 Created tenant role...')
    await prisma.role.create({
		data: {
			name: 'tenant',
			permissions: {
				connect: await prisma.permission.findMany({
					select: { id: true },
					where: { access: 'own' },
				}),
			},
		},
	})
	console.timeEnd('👑 Created tenant role...')

	if (process.env.MINIMAL_SEED) {
		console.log('👍 Minimal seed complete')
		console.timeEnd(`🌱 Database has been seeded`)
		return
	}

	const totalUsers = 5
	console.time(`👤 Created ${totalUsers} users...`)
	const noteImages = await getNoteImages()
	const userImages = await getUserImages()
    
    const users = await Promise.all(
        Array.from({ length: totalUsers }, async (_, index) => {
            const userData = createUser()
            const user = await prisma.user
                .create({
                    data: {
                        ...userData,
                        password: { create: createPassword(userData.username) },
                        image: { create: userImages[index % userImages.length] },
                        roles: { connect: { name: 'tenant' } },
                        notes: {
                            create: Array.from({
                                length: faker.number.int({ min: 1, max: 3 }),
                            }).map(() => ({
                                title: faker.lorem.sentence(),
                                content: faker.lorem.paragraphs(),
                                images: {
                                    create: Array.from({
                                        length: faker.number.int({ min: 1, max: 3 }),
                                    }).map(() => {
                                        const imgNumber = faker.number.int({ min: 0, max: 9 })
                                        return noteImages[imgNumber]
                                    }),
                                },
                            })),
                        },
                    },
                })
                .catch(e => {
                    console.error('Error creating a user:', e)
                    return null
                })
            return user
        })
    )
	console.timeEnd(`👤 Created ${totalUsers} tenant users...`)

    const tenantOwner = await users[1]
    console.log(`👤 Created tenantOwner: ${tenantOwner.username}`)
    const tenantAdmin = await users[0]
    console.log(`👤 Created tenantAdmin: ${tenantAdmin.username}`)
    const tenantMember = await users[2]
    console.log(`👤 Created tenantMember: ${tenantMember.username}`)

    console.time(`🛐 Create TenantOwner Role/Permission...`)

    await prisma.role.deleteMany({ where: { name: 'tenantOwner' } })
    const tenantOwnerRole = await prisma.role.create({
        data: {
            name: 'tenantOwner',
            permissions: {
                connect: await prisma.permission.findMany({
                    select: { id: true },
                    where: { access: 'own' },
                }),
            },
        },
    })

    console.timeEnd(`🛐 Create TenantOwner Role/Permission...`)

    console.time(`🛐 Create TenantAdmin Role/Permission...`)
    await prisma.role.deleteMany({ where: { name: 'tenantAdmin' } })
    const tenantAdminRole = await prisma.role.create({
        data: {
            name: 'tenantAdmin',
            permissions: {
                connect: await prisma.permission.findMany({
                    select: { id: true },
                    where: { access: 'own' },
                }),
            },
        },
    })

    console.timeEnd(`🛐 Create TenantAdmin Role/Permission...`)

    console.time(`🛐 Create TenantMember Role/Permission...`)
    await prisma.role.deleteMany({ where: { name: 'tenantMember' } })
    const tenantMemberRole = await prisma.role.create({
        data: {
            name: 'tenantMember',
            permissions: {
                connect: await prisma.permission.findMany({
                    select: { id: true },
                    where: { access: 'own' },
                }),
            },
        },
    })

    console.timeEnd(`🛐 Create TenantMember Role/Permission...`)

    console.time(`🛐 Create TenantGuest Role/Permission...`)
    await prisma.role.deleteMany({ where: { name: 'tenantGuest' } })
    const tenantGuestRole = await prisma.role.create({
        data: {
            name: 'tenantGuest',
            permissions: {
                connect: await prisma.permission.findMany({
                    select: { id: true },
                    where: { access: 'own' },
                }),
            },
        },
    })

    console.timeEnd(`🛐 Create TenantGuest Role/Permission...`)

    console.time(`📇 Create Tenant 1 & workspace T1.Workspace 1, T1.Workspace 2`)
    await createTenant(
        "Tenant 1",
        ["T1.Workspace 1", "T1.Workspace 2"],
        [
            { ...tenantOwner, role: tenantOwnerRole },
            { ...tenantAdmin, role: tenantAdminRole },
            { ...tenantMember, role: tenantMemberRole },
        ]
    );
    console.timeEnd(`📇 Create Tenant 1 & workspace T1.Workspace 1, T1.Workspace 2`)

    console.time(`📇 Create Tenant 2 & workspace T2.Workspace 1, T2.Workspace 2`)
    await createTenant(
        "Tenant 2",
        ["T2.Workspace 1", "T2.Workspace 2"],
        [
            { ...tenantAdmin, role: tenantOwnerRole },
            { ...tenantMember, role: tenantMemberRole },
        ]
    );

    console.timeEnd(`📇 Create Tenant 2 & workspace T2.Workspace 1, T2.Workspace 2`)
	console.timeEnd(`🌱 Database has been seeded`)
}

seed()
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})