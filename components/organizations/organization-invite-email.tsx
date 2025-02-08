import {
  Container,
  Head,
  Heading,
  Html,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface OrganizationInviteEmailProps {
  organizationName: string;
  code: string;
  expires: Date;
  inviterEmail: string;
  role: string;
}

export function OrgInviteByEmail({
  organizationName,
  code,
  expires,
  inviterEmail,
  role,
}: OrganizationInviteEmailProps) {
  return (
    <Html>
      <Tailwind>
        <Head />
        <Container className="container px-20 font-sans">
          <Heading className="text-xl font-bold mb-4">
            Join {organizationName}
          </Heading>
          <Text className="text-sm mb-4">
            {` You've been invited by ${inviterEmail} to join ${organizationName} as
            a ${role}.`}
          </Text>
          <Section className="text-center my-8">
            <Text className="font-semibold mb-2">Verification code</Text>
            <Text className="font-bold text-4xl mb-4">{code}</Text>
            <Text className="text-sm text-gray-600">
              (Code expires in{" "}
              {Math.floor((+expires - Date.now()) / (60 * 1000))} minutes)
            </Text>
          </Section>
          <Text className="text-sm text-gray-600">
            If you did not request this invitation, please ignore this email.
          </Text>
        </Container>
      </Tailwind>
    </Html>
  );
}
