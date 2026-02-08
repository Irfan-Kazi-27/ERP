import mongoose from "mongoose";
import { Lead } from "../src/models/leads.models.js";
import { Party } from "../src/models/party.models.js";
import dotenv from "dotenv";

dotenv.config({ path: './.env' });

const migrateLeadsToParty = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const leads = await Lead.find({});
        console.log(`Found ${leads.length} leads to check for migration`);

        let migratedCount = 0;
        let errorCount = 0;

        for (const lead of leads) {
            // Check if lead has embedded customer data (old format)
            // Note: In strict mode, Mongoose might not populate 'customer' if it's defined as ObjectId but contains object data in DB
            // We rely on the fact that if it's an object with 'email', it needs migration.
            // However, after schema change, 'customer' field expects ObjectId.
            // If the DB still has embedded object, Mongoose might strip it or throw error on save if we don't handle it carefully.
            // For this script, we access the raw object if needed, but let's assume we can read it.

            // Actually, since we changed the schema to ObjectId, Mongoose might return null for 'customer' if it holds an object.
            // We should use lean() to get raw data.

        }

        // Re-fetching with lean to see actual data structure in DB
        const rawLeads = await Lead.find({}).lean();

        for (const lead of rawLeads) {
            if (lead.customer && typeof lead.customer === 'object' && !lead.customer._id && lead.customer.email) {
                console.log(`Migrating lead: ${lead.leadNo}`);

                try {
                    // Find or create party
                    let party = await Party.findOne({ email: lead.customer.email });

                    if (!party) {
                        party = await Party.create({
                            name: lead.customer.name,
                            contact: lead.customer.contact,
                            email: lead.customer.email,
                            companyName: lead.customer.companyName,
                            address: lead.customer.address,
                            createdBy: lead.createdBy, // Use lead creator as party creator
                            type: 'PROSPECT',
                            status: 'ACTIVE'
                        });
                        console.log(`  Created new Party: ${party.name}`);
                    } else {
                        console.log(`  Linked to existing Party: ${party.name}`);
                    }

                    // Update lead with Party ID
                    await Lead.updateOne(
                        { _id: lead._id },
                        { $set: { customer: party._id } }
                    );

                    migratedCount++;
                } catch (err) {
                    console.error(`  Failed to migrate lead ${lead.leadNo}: ${err.message}`);
                    errorCount++;
                }
            }
        }

        console.log("Migration completed");
        console.log(`Migrated: ${migratedCount}`);
        console.log(`Errors: ${errorCount}`);

        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migrateLeadsToParty();
