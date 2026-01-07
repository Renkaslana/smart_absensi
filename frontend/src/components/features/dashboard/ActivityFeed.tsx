import { motion } from 'framer-motion';
import { Activity, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';

interface ActivityItemProps {
  icon: React.ReactElement;
  title: string;
  description: string;
  time: string;
  color: string;
}

const ActivityItem = ({ icon, title, description, time, color }: ActivityItemProps) => {
  return (
    <motion.div
      whileHover={{ x: 5, backgroundColor: '#F9FAFB' }}
      className="flex items-start gap-4 p-4 rounded-xl transition-colors cursor-pointer"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm mb-1">{title}</p>
        <p className="text-xs text-gray-600">{description}</p>
        <p className="text-xs text-gray-400 mt-1">{time}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-2" />
    </motion.div>
  );
};

interface Activity {
  icon: React.ReactElement;
  title: string;
  description: string;
  time: string;
  color: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

export const ActivityFeed = ({ activities }: ActivityFeedProps) => {
  return (
    <Card className="shadow-xl border-0 bg-white">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <CardTitle className="text-xl">Recent Activity</CardTitle>
          </div>
          <button className="text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors">
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-2">
          {activities.map((activity, index) => (
            <ActivityItem 
              key={index}
              {...activity}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
