import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TermsContactDetails from "@/components/layout/TermsContactDetails";

export const metadata = {
  title: "Terms of Service | Dunnies Store",
  description: "Read our terms of service and conditions of use.",
};

export default function TermsPage() {
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
              Terms of Service
            </h1>
            <p className="text-gray-500">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                1. Agreement to Terms
              </h2>
              <p>
                By accessing and using Dunnies Store (the "Service"), you accept
                and agree to be bound by the terms and provision of this
                agreement. If you do not agree to abide by the above, please do
                not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                2. Use License
              </h2>
              <p>
                Permission is granted to temporarily download one copy of the
                materials (information or software) on Dunnies Store for
                personal, non-commercial transitory viewing only. This is the
                grant of a license, not a transfer of title, and under this
                license you may not:
              </p>
              <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
                <li>Modifying or copying the materials</li>
                <li>
                  Using the materials for any commercial purpose or for any
                  public display
                </li>
                <li>
                  Attempting to decompile or reverse engineer any software
                  contained on the Service
                </li>
                <li>
                  Removing any copyright or other proprietary notations from the
                  materials
                </li>
                <li>
                  Transferring the materials to another person or "mirroring"
                  the materials on any other server
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                3. Disclaimer
              </h2>
              <p>
                The materials on Dunnies Store are provided on an "as is" basis.
                Dunnies Store makes no warranties, expressed or implied, and
                hereby disclaims and negates all other warranties including,
                without limitation, implied warranties or conditions of
                merchantability, fitness for a particular purpose, or
                non-infringement of intellectual property or other violation of
                rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                4. Limitations
              </h2>
              <p>
                In no event shall Dunnies Store or its suppliers be liable for
                any damages (including, without limitation, damages for loss of
                data or profit, or due to business interruption,) arising out of
                the use or inability to use the materials on Dunnies Store, even
                if Dunnies Store or a Dunnies Store authorized representative
                has been notified orally or in writing of the possibility of
                such damage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                5. Accuracy of Materials
              </h2>
              <p>
                The materials appearing on Dunnies Store could include
                technical, typographical, or photographic errors. Dunnies Store
                does not warrant that any of the materials on the Service are
                accurate, complete, or current. Dunnies Store may make changes
                to the materials contained on its website at any time without
                notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                6. Links
              </h2>
              <p>
                Dunnies Store has not reviewed all of the sites linked to its
                website and is not responsible for the contents of any such
                linked site. The inclusion of any link does not imply
                endorsement by Dunnies Store of the site. Use of any such linked
                website is at the user's own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                7. Modifications
              </h2>
              <p>
                Dunnies Store may revise these terms of service for its website
                at any time without notice. By using this website, you are
                agreeing to be bound by the then current version of these terms
                of service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                8. Governing Law
              </h2>
              <p>
                These terms and conditions are governed by and construed in
                accordance with the laws of Nigeria, and you irrevocably submit
                to the exclusive jurisdiction of the courts in that location.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                9. User Accounts
              </h2>
              <p>
                If you create an account on Dunnies Store, you are responsible
                for maintaining the security of your account and you are fully
                responsible for all activities that occur under the account. You
                must immediately notify Dunnies Store of any unauthorized uses
                of your account or any other breaches of security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                10. Limitation on Liability
              </h2>
              <p>
                EXCEPT AS EXPRESSLY PROVIDED OTHERWISE, NEITHER DUNNIES STORE
                NOR ANY OF ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS SHALL
                BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
                OR PUNITIVE DAMAGES, HOWEVER CAUSED AND REGARDLESS OF THE THEORY
                OF LIABILITY, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
                DAMAGES.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                11. Contact Us
              </h2>
              <p>
                If you have any questions about these Terms of Service, please
                contact us at:
              </p>
              <TermsContactDetails />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
