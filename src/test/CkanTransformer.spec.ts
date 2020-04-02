import { expect } from "chai";
import "mocha";
import createTransformer from "../createTransformer";
import { getArgv } from "../setup";
import createBuilderOptions from "../createBuilderOptions";

const argv = getArgv();

async function getTransformer() {
    const transformerOptions = {
        ...(await createBuilderOptions()),
        id: argv.id,
        name: argv.name,
        sourceUrl: argv.sourceUrl,
        tenantId: argv.tenantId
    };

    return createTransformer(transformerOptions);
}

describe("CkanTransformer", () => {
    describe("organizationJsonToRecord", () => {
        it("should not record the default description", async () => {
            const organization = JSON.parse(
                `{
                    "description": "A little information about my organization...",
                    "id": "123", 
                    "name": "abc"
                }`
            );

            const transformer = await getTransformer();
            const theRecord = transformer.organizationJsonToRecord(
                organization
            );
            expect(theRecord.id).to.equal("org-test-123");
            expect(theRecord.name).to.equal("abc");

            const organizationDetailsAspect =
                theRecord.aspects["organization-details"];
            expect(organizationDetailsAspect.description).to.equal("");
            expect(organizationDetailsAspect.name).to.equal("abc");
        });

        it("should not revise the non-default description", async () => {
            const organization = JSON.parse(
                `{
                    "description": "This description should be kept.",
                    "id": "456", 
                    "name": "def"
                }`
            );

            const transformer = await getTransformer();
            const theRecord = transformer.organizationJsonToRecord(
                organization
            );
            expect(
                theRecord.aspects["organization-details"].description
            ).to.equal("This description should be kept.");
        });
    });
});
