import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Dunnies Store",
  description: "Read our privacy policy and learn how we protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Privacy Policy
            </h1>
            <p className="text-gray-500">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                1. Introduction
              </h2>
              <p>
                Dunnies Store ("we", "us", "our", or "Company") operates the
                Dunnies Store website and mobile application (the "Service").
                This page informs you of our policies regarding the collection,
                use, and disclosure of personal data when you use our Service
                and the choices you have associated with that data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                2. Information Collection and Use
              </h2>
              <p>
                We collect several different types of information for various
                purposes:
              </p>
              <h3 className="font-semibold text-gray-900 mt-4 mb-2">
                2.1 Personal Data
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Email address</li>
                <li>First name and last name</li>
                <li>Phone number</li>
                <li>Address, State, Province, ZIP/Postal code, City</li>
                <li>Cookies and Usage Data</li>
              </ul>
              <h3 className="font-semibold text-gray-900 mt-4 mb-2">
                2.2 Usage Data
              </h3>
              <p>
                We may also collect information about how the Service is
                accessed and used ("Usage Data"). This may include information
                such as your computer's Internet Protocol address (e.g. IP
                address), browser type, browser version, the pages you visit,
                the time and date of your visit, the time spent on those pages,
                and other diagnostic data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                3. Use of Data
              </h2>
              <p>Dunnies Store uses the collected data for various purposes:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>To provide and maintain our Service</li>
                <li>To notify you about changes to our Service</li>
                <li>
                  To allow you to participate in interactive features of our
                  Service when you choose to do so
                </li>
                <li>To provide customer support</li>
                <li>
                  To gather analysis or valuable information so that we can
                  improve our Service
                </li>
                <li>To monitor the usage of our Service</li>
                <li>To detect, prevent and address technical issues</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                4. Security of Data
              </h2>
              <p>
                The security of your data is important to us but remember that
                no method of transmission over the Internet or method of
                electronic storage is 100% secure. While we strive to use
                commercially acceptable means to protect your Personal Data, we
                cannot guarantee its absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                5. Cookies
              </h2>
              <p>
                We use cookies and similar tracking technologies to track
                activity on our Service and to hold certain information. You can
                instruct your browser to refuse all cookies or to indicate when
                a cookie is being sent. However, if you do not accept cookies,
                you may not be able to use some portions of our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                6. Links to Other Sites
              </h2>
              <p>
                Our Service may contain links to other sites that are not
                operated by us. If you click on a third-party link, you will be
                directed to that third party's site. We strongly advise you to
                review the Privacy Policy of every site you visit.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                7. Children's Privacy
              </h2>
              <p>
                Our Service does not address anyone under the age of 18
                ("Children"). We do not knowingly collect personally
                identifiable information from anyone under the age of 18. If you
                are a parent or guardian and you are aware that your Child has
                provided us with Personal Data, please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                8. Changes to This Privacy Policy
              </h2>
              <p>
                We may update our Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page and updating the "Last updated" date at the top of
                this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                9. Your Rights
              </h2>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Access: You have the right to access the Personal Data we hold
                  about you
                </li>
                <li>
                  Correction: You have the right to request that we correct any
                  inaccurate or incomplete data
                </li>
                <li>
                  Deletion: You have the right to request that we delete your
                  Personal Data
                </li>
                <li>
                  Opt-out: You have the right to opt-out of certain data
                  processing activities
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                10. Contact Us
              </h2>
              <p>
                If you have any questions about this Privacy Policy, please
                contact us at:
              </p>
              <div className="mt-4 space-y-2">
                <p>Email: privacy@dunniesstore.com</p>
                <p>Phone: +234 (0) 123 456 7890</p>
                <p>Address: Dunnies Store, Lagos, Nigeria</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                11. Data Retention
              </h2>
              <p>
                We will retain your Personal Data only for as long as necessary
                for the purposes set out in this Privacy Policy. We will retain
                and use your Personal Data to the extent necessary to comply
                with our legal obligations, resolve disputes, and enforce our
                legal agreements and policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                12. International Data Transfers
              </h2>
              <p>
                Your information, including Personal Data, may be transferred
                to—and maintained on—computers located outside of your state,
                province, country or other governmental jurisdiction where the
                data protection laws may differ than those from your
                jurisdiction.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
