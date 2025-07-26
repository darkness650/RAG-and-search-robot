import { lazy } from "react";
import { Navigate } from "react-router-dom";

const Layout = lazy(() => import("@/layout"));
const IOT = lazy(() => import("@/pages/IOT"));
const IOTPage = lazy(() => import("@/pages/IOT/page"));
const IOTAddEdit = lazy(() => import("@/pages/IOT/itoAddEdit"));
const IOTDetails = lazy(() => import("@/pages/IOT/iotDetails"));
const IOTDemoone = lazy(() => import("@/pages/IOT/component/demoone"));
const IOTDemotwo = lazy(() => import("@/pages/IOT/component/demotwo"));
const IOTDemothree = lazy(() => import("@/pages/IOT/component/demothree"));
const IOTDemofour = lazy(() => import("@/pages/IOT/component/demofour"));

const DocumentLearn = lazy(() => import("@/pages/IOT/component/preReleaseComponents/documentlearn"));
const VideoSummary = lazy(() => import("@/pages/IOT/component/preReleaseComponents/videosummary"));
const PictureMaking = lazy(() => import("@/pages/IOT/component/preReleaseComponents/picturemaking"))
const Dialog = lazy(() => import("@/pages/IOT/component/preReleaseComponents/dialog"));

const IOTTypeServiceList = lazy(() => import("@/pages/IOT/component/typeServiceList"));


const IOTTypeVerify = lazy(() => import("@/pages/IOT/component/typeVerify"));

const EnvironmentManage = lazy(() => import("@/pages/environmentManage"));

const Guanli = lazy(()=> import("@/pages/IOT/component/reviewComponents/testForms"));
const routes =[
	{
		paths:'/',
		element:<Layout />,
		children:[
			{
				path:'IOT',
				element:<IOT/>,
				title:'登录',
				
				children:[
					{
						index:true,
						element:<Navigate to="IOTPage" replace/>,
					},
					{
						path:'guanli',
						element:<Guanli/>
					},
					{
						path: 'IOTPage',
						name: "IOT发布首页",
						element: <IOTPage />,
						title: 'IOT发布首页', // 添加 title 用于菜单显示
					},
					{
						path: 'IOTAddEdit/:type/:id?',
						name: "IOT发布新增编辑页面",
						element: <IOTAddEdit />,
					},
					{
						path: 'IOTDemoone',
						name: "IOT提单问题汇总",
						element: <IOTDemoone />,
					},
					{
						path: 'IOTDemotwo',
						name: "IOT发布—线上发布验收状态页面",
						element: <IOTDemotwo />,
					},
					{
						path: `IOTDemothree`,
						name: "IOT发布—预发布状态页面",
						element: <IOTDemothree />,
					},
					{
						path: 'IOTDemofour',
						name: "IOT发布—发布评审状态页面",
						element: <IOTDemofour />,
					},
					{
						path: 'IOTDetails/:id',
						name: "IOT发布详情页面",
						element: <IOTDetails />,
					},
				
					{
						path: 'videosummary',
						name: "IOT发布详情页面",
						element: <VideoSummary />,
					},
					{
						path: 'picturemaking',
						name: "IOT发布详情页面",
						element: <PictureMaking />,
					},
					{
						path: 'dialog',
						name: "IOT发布详情页面",
						element: <Dialog />,
					},
					
					{
						path: 'IOTtype_ServiceList/:id',
						name: "IOT发布—服务列表页面",
						element: <IOTTypeServiceList />,
					},
			
					{
						path: `documentlearn`,
						name: "IOT发布—预发布状态页面",
						element: <DocumentLearn />,
					},
					{
						path: 'IOTType_Verify/:id',
						name: "IOT发布—预发布验证状态页面",
						element: <IOTTypeVerify />,
					},
				
					// {
					// 	path: 'IOTAccept/:id',
					// 	name: "IOT发布—线上发布验收状态页面",
					// 	element: <IOTOfficiallyReleased />,
					// },
				],
			},
			{
				path: 'IOTDetails',
				
				title:'虚拟对话',
				hidden: true,
				element: <IOTDetails />,
			},
			{
				path:'environmentManage',
				element:<EnvironmentManage/>,
				title:'新对话',
				requiresLogin: true,
			},
			{
				path:'/',
				element:<Navigate to="IOT" replace />,
				title:'觉醒吧海螺',
				
				hidden: true,
			},//直接重定向到IOT
   
		],
	},
];

export default routes;