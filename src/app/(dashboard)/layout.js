import DashboardClientShell from './DashboardClientShell';

export const metadata = {
  title: 'Operational Terminal | MR BILAL POS',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function DashboardLayout({ children }) {
  return <DashboardClientShell>{children}</DashboardClientShell>;
}
